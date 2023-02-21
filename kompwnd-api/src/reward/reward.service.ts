import { BadRequestException, Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j/dist';
import { constants } from 'src/constants';
import { MatchService } from 'src/match/match.service';
import { ReferralService } from 'src/referral/referral.service';
import { AlaioService } from 'src/services/alaio/alaio.service';
import { SharedService } from 'src/services/shared/shared.service';

@Injectable()
export class RewardService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly alaioService: AlaioService,
    private readonly sharedService: SharedService,
    private readonly referralService: ReferralService,
    private readonly matchService: MatchService,
  ) {}

  ////////////////////////////////////////////////////
  // Create a user's withdrawal
  ////////////////////////////////////////////////////
  async createWithdrawal(
    account_name: any,
    total: number,
    dividend: number,
    match: number,
    referral: number,
  ): Promise<void> {
    // convert KPW amount to USD
    const total_USD = total;
    const dividend_USD = dividend;
    const match_USD = match;
    const referral_USD = referral;

    try {
      await this.neo4jService.write(
        `
          MATCH (u:User {account_name: $account_name})
          CREATE (w:Withdrawal)
          SET w += $properties, w.id = randomUUID(), w.created_at = timestamp()
          CREATE (u)-[:WITHDREW]->(w)
        `,
        {
          account_name,
          properties: {
            amount_KPW: total,
            amount_USD: total_USD,
            dividend_KPW: dividend,
            dividend_USD: dividend_USD,
            match_KPW: match,
            match_USD: match_USD,
            referral_KPW: referral,
            referral_USD: referral_USD,
          },
        },
      );
    } catch (e) {
      console.log('out', e);
    }
  }

  ////////////////////////////////////////////////////
  // Calculate reward = dividend + match bonus + referral bonus
  ////////////////////////////////////////////////////
  async calculateReward(account_name: string): Promise<any> {
    const { divAmount, referralBonus, matchBonus } =
      await this.calculateDivAmount(account_name, 0);

    return {
      status: 200,
      reward: {
        divAmount,
        referralBonus,
        matchBonus,
      },
      message: 'Reward has been claimed successfully.',
    };
  }

  ////////////////////////////////////////////////////
  // Claim reward = dividend + match bonus + referral bonus
  ////////////////////////////////////////////////////
  async claimReward(account_name: string): Promise<any> {
    const {
      rewards,
      rewards_USD,
      divAmountInKPW: claimAmountInKPW,
      divAmount,
      referralBonus,
      matchBonus,
    } = await this.calculateDivAmount(
      account_name,
      constants.CLAIM_DIV_THRESHOLD,
    );

    // Call on-chain claim action
    const res = await this.alaioService
      .pushTransaction(
        'claim',
        constants.CONTRACT,
        {
          user: account_name,
          quantity: claimAmountInKPW,
        },
        constants.CONTRACT,
      )
      .catch((e) => {
        console.log('error in claiming', e);
        throw new BadRequestException(e.details[0]?.message);
      });

    console.log('claimed successfully, updating');

    await this.updateDivsAndRewards(account_name, rewards, rewards_USD);

    await this.createWithdrawal(
      account_name,
      divAmount,
      rewards,
      matchBonus,
      referralBonus,
    );

    return {
      status: 200,
      action_details: res,
      reward: {
        divAmount,
        referralBonus,
        matchBonus,
      },
      message: 'Reward has been calculated successfully.',
    };
  }

  ////////////////////////////////////////////////////
  // Roll reward = dividend + match bonus + referral bonus
  ////////////////////////////////////////////////////
  async rollReward(account_name: string): Promise<any> {
    const {
      rewards,
      rewards_USD,
      divAmount,
      divAmountInKPW: rollAmountInKPW,
      referralBonus,
      matchBonus,
    } = await this.calculateDivAmount(
      account_name,
      constants.ROLL_DIV_THRESHOLD,
    );

    // Call on-chain roll action
    const res = await this.alaioService
      .pushTransaction(
        'roll',
        constants.CONTRACT,
        {
          user: account_name,
          quantity: rollAmountInKPW,
        },
        constants.CONTRACT,
      )
      .catch((e) => {
        console.log('error in rolling', e);
        throw new BadRequestException(e.details[0]?.message);
      });

    console.log('rolled successfully, updating');

    await this.updateDivsAndRewards(account_name, rewards, rewards_USD);

    await this.sharedService.updateActiveDeposit(account_name, divAmount);

    return {
      status: 200,
      action_details: res,
      reward: {
        divAmount,
        referralBonus,
        matchBonus,
      },
      message: 'Roll action has been executed successfully',
    };
  }

  ////////////////////////////////////////////////////
  // Check if max dividend has been paid to a user
  ////////////////////////////////////////////////////
  async isMaxDivPaid(account_name: any): Promise<any> {
    console.log(account_name);
    try {
      const result = await this.neo4jService.read(
        `
          MATCH (u:User {account_name: $account_name})-[:DEPOSITED]->(d:Deposit)
          WITH u, SUM(d.amount_KPW) AS total_deposits
          MATCH (u)-[:EARNED]->(e:Referral|Dividend|Match {claimed: true})
          WITH total_deposits, SUM(e.amount_KPW) AS total_earned
          RETURN total_deposits * 2 <= total_earned AS max_div_paid, total_deposits, total_earned
        `,
        {
          account_name,
        },
      );

      console.log('result.records', result.records);

      console.log({
        max_div_paid: result.records[0].get('max_div_paid'),
        total_deposits: result.records[0].get('total_deposits'),
        total_earned: result.records[0].get('total_earned'),
      });

      return result.records.length > 0
        ? {
            max_div_paid: result.records[0].get('max_div_paid'),
            total_deposits: result.records[0].get('total_deposits'),
            total_earned: result.records[0].get('total_earned'),
          }
        : false;
    } catch (error) {
      console.log('out', error);
      return { max_div_paid: false };
    }
  }

  ////////////////////////////////////////////////////
  // Calculate amount to claim or roll
  ////////////////////////////////////////////////////
  async calculateDivAmount(
    account_name: any,
    div_threshold: number,
  ): Promise<any> {
    // Does user has an active deposit
    const isDepositActive = await this.sharedService.doesUserHaveActiveDeposit(
      account_name,
    );
    if (!isDepositActive)
      throw new BadRequestException('User does not have an active deposit.');

    // Are maximum dividends paid to user?
    const {
      max_div_paid: isMaxDivPaid,
      total_deposits,
      total_earned,
    } = await this.isMaxDivPaid(account_name);

    if (isMaxDivPaid)
      throw new BadRequestException(
        'Deposit fulfilled please deposit more to create a new deposit.',
      );

    // Check if user has a buddy
    const buddy = await this.sharedService.getBuddy(account_name);
    if (buddy == '')
      throw new BadRequestException(
        'Not sure how you got to this point without a buddy . . .',
      );

    // Calculate user's daily rewards
    const deposit = await this.sharedService.getActiveDeposit(account_name);
    let rewards = await this.sharedService.calculateReward(
      account_name,
      deposit.amount_KPW,
    );

    // Convert to USD needs to be implemented
    let rewards_USD = rewards;

    // Dividends should be more than $50
    if (rewards_USD < div_threshold) {
      console.log('dividend less than $50');
      // rewards = 0;
      // rewards_USD = 0;
    }

    // Get user's unclaimed referral bonuses and update claim amount
    const referralBonus = await this.referralService.getUnclaimedReferralBonus(
      account_name,
    );
    let divAmount = rewards + referralBonus;

    // Get user's unclaimed match bonuses, check eligibility and update claim amount
    const matches = await this.matchService.getMatchBonus({
      account_name,
      claimed: 'false',
    });

    // Filter eligible bonuses and calculate match bonus
    // matchBonuses.filter
    const matchBonus = matches.reduce(
      (total, obj) => total + obj.amount_KPW,
      0,
    );
    divAmount += matchBonus;

    // Check reward is not more than maximum dividend, spill extra
    const max_div = total_deposits * 2;
    if (total_earned + divAmount > max_div) {
      divAmount = max_div - total_earned;
    }

    const claimFee = divAmount * constants.FEE_PERCENTAGE;

    console.log('claim amount =>', divAmount);
    console.log('fee amount =>', claimFee);

    const divAmountInKPW = this.sharedService.amountToKPW(divAmount);
    const feeAmountInKPW = this.sharedService.amountToKPW(claimFee);

    console.log('claim amount in KPW =>', divAmountInKPW);

    if (divAmountInKPW == constants.ZERO_KPW)
      throw new BadRequestException('Claim amount is equals to zero');

    if (feeAmountInKPW == constants.ZERO_KPW)
      throw new BadRequestException('Claim fee is equals to zero');

    return {
      rewards,
      rewards_USD,
      divAmountInKPW,
      divAmount,
      referralBonus,
      matchBonus,
    };
  }

  ////////////////////////////////////////////////////
  // Update dividends and reward balances after claim or roll
  ////////////////////////////////////////////////////
  async updateDivsAndRewards(
    account_name: any,
    rewards: number,
    rewards_USD: number,
  ): Promise<any> {
    // Create match bonuses for upline buddies
    await this.matchService.emplaceMatches(account_name, rewards, 0);

    // Update user's match bonuses as claimed
    await this.matchService.markMatchesAsClaimed(account_name);

    // Update user's referral bonuses as claimed
    await this.referralService.markReferralsAsClaimed(account_name);

    // Create dividend node in the database
    await this.neo4jService.write(
      `
            MATCH (u:User {account_name: $account_name})
            CREATE (d:Dividend)
            SET d += $properties, d.id = randomUUID(), d.created_at = timestamp()
            CREATE (u)-[:EARNED]->(d)
          `,
      {
        account_name,
        properties: {
          amount_KPW: rewards,
          amount_USD: rewards_USD,
          claimed: true,
        },
      },
    );
  }
}
