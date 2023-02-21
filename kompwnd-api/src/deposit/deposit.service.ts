import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j/dist';
import { constants } from 'src/constants';
import { ReferralService } from 'src/referral/referral.service';
import { AlaioService } from 'src/services/alaio/alaio.service';
import { SharedService } from 'src/services/shared/shared.service';

@Injectable()
export class DepositService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly alaioService: AlaioService,
    private readonly referralService: ReferralService,
    private readonly sharedService: SharedService,
  ) {}

  ////////////////////////////////////////////////////
  // Add a user's deposit
  ////////////////////////////////////////////////////
  async addDeposit(account_name: any): Promise<void> {
    try {
      console.log('adding a deposit ', account_name);

      // Check if user has transferred KPW
      const deposit = await this.alaioService.getRows({
        table: 'deposits',
        lower_bound: account_name,
        upper_bound: account_name,
        limit: 1,
      });
      if (deposit.rows.length <= 0) return;

      // Check if transfer amount is less than $10 in value throw an error
      if (false) throw new Error('deposit less than $10');

      // Check if user has a buddy
      const buddy = await this.sharedService.getBuddy(account_name);
      if (buddy == '') throw new Error('buddy cannot be empty');

      console.log('deposit rows', deposit.rows);

      // Update user's transfer in contract and burn KPW
      await this.alaioService
        .pushTransaction(
          'adddeposit',
          constants.CONTRACT,
          {
            user: account_name,
          },
          constants.CONTRACT,
        )
        .catch((e) => {
          console.log('error in add deposit', e);
          return;
        });

      const amount = deposit.rows[0].deposit;
      const referralBonusAmount = amount * constants.REFERRAL_PERCENTAGE;
      const isUserDepositActive =
        await this.sharedService.doesUserHaveActiveDeposit(account_name);
      const isBuddyDepositActive =
        await this.sharedService.doesUserHaveActiveDeposit(buddy);

      // Reward referral bonus if buddy has active deposit
      if (isBuddyDepositActive) {
        await this.referralService.addReferralBonus(buddy, referralBonusAmount);
      }

      // If user has an active deposit
      if (isUserDepositActive) {
        // Calculate and update amount with current div + match + referral
        // Create match bonuses for upline buddies
        // Update self and team level
        // Make all current deposits inactive
        await this.deactivateDeposit(account_name);
      }

      // Create deposit entry
      await this.createDeposit(account_name, amount);

      console.log('deposit complete');
    } catch (error) {
      console.log('out', error);
      const res = await this.alaioService
        .pushTransaction(
          'rmvdeposit',
          constants.CONTRACT,
          {
            user: account_name,
          },
          constants.CONTRACT,
        )

        .catch((e) => {
          console.log('error: ', e);
        });
      // console.log('success: ', account_name, res);
    }
  }

  ////////////////////////////////////////////////////
  // Create a user's deposit
  ////////////////////////////////////////////////////
  async createDeposit(account_name: any, amount: number): Promise<void> {
    // convert KPW amount to USD
    const amount_USD = amount;

    try {
      await this.neo4jService.write(
        `
          MATCH (u:User {account_name: $account_name})
          CREATE (d:Deposit)
          SET d += $properties, d.id = randomUUID(), d.created_at = timestamp()
          CREATE (u)-[:DEPOSITED]->(d)
        `,
        {
          account_name,
          properties: {
            amount_KPW: amount,
            amount_USD,
            active: true,
          },
        },
      );
    } catch (e) {
      console.log('out', e);
    }
  }

  ////////////////////////////////////////////////////
  // Mark all deposits as inactive
  ////////////////////////////////////////////////////
  async deactivateDeposit(account_name: any): Promise<void> {
    try {
      await this.neo4jService.write(
        `
          MATCH (:User {account_name: $account_name})-[:DEPOSITED]->(d:Deposit)
          SET d.active = false
        `,
        {
          account_name,
        },
      );
    } catch (e) {
      console.log('out', e);
    }
  }

  ////////////////////////////////////////////////////
  // Check if specified deposit is active
  ////////////////////////////////////////////////////
  async isDepositActive(deposit_id: any): Promise<boolean> {
    try {
      const result = await this.neo4jService.read(
        `
          MATCH (d:Deposit {id: $id})
          RETURN CASE WHEN d.created_at > timestamp() - 86400000 * $days THEN true ELSE false END AS is_active
        `,
        {
          id: deposit_id,
          days: constants.ACTIVE_DEPOSIT_DURATION,
        },
      );

      return result.records.length > 0
        ? result.records[0].get('is_active')
        : false;
    } catch (error) {
      console.log('out', error);
      return false;
    }
  }
}
