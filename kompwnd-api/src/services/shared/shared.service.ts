import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j/dist';
import { constants } from 'src/constants';

@Injectable()
export class SharedService {
  constructor(private readonly neo4jService: Neo4jService) {}

  ////////////////////////////////////////////////////
  // Check if specified specified user has an active deposit
  ////////////////////////////////////////////////////
  async doesUserHaveActiveDeposit(account_name: any): Promise<boolean> {
    try {
      const result = await this.neo4jService.read(
        `
          MATCH (u:User {account_name: $account_name})-[:DEPOSITED]->(d:Deposit {active: true})
          WHERE d.created_at > timestamp() - 86400000 * $days
          RETURN COUNT(d) > 0 AS active_deposits
        `,
        {
          account_name,
          days: constants.ACTIVE_DEPOSIT_DURATION,
        },
      );

      return result.records.length > 0
        ? result.records[0].get('active_deposits')
        : false;
    } catch (error) {
      console.log('out', error);
      return false;
    }
  }

  ////////////////////////////////////////////////////
  // Get user's active deposit
  ////////////////////////////////////////////////////
  async getActiveDeposit(account_name: any): Promise<any> {
    try {
      const result = await this.neo4jService.read(
        `
          MATCH (u:User {account_name: $account_name})-[:DEPOSITED]->(d:Deposit {active: true})
          WHERE d.created_at > timestamp() - 86400000 * $days
          RETURN d
        `,
        {
          account_name,
          days: constants.ACTIVE_DEPOSIT_DURATION,
        },
      );

      return result.records.length > 0
        ? result.records[0]?.get('d').properties
        : false;
    } catch (error) {
      console.log('out', error);
      return false;
    }
  }

  ////////////////////////////////////////////////////
  // Update user's active deposit after roll
  ////////////////////////////////////////////////////
  async updateActiveDeposit(
    account_name: string,
    rollAmount: number,
  ): Promise<void> {
    try {
      const activeDeposit = await this.getActiveDeposit(account_name);
      const newDeposit =
        activeDeposit.amount_KPW + rollAmount * constants.ROLL_PERCENTAGE;

      // convert KPW amount to USD
      const amount_USD = newDeposit;

      await this.neo4jService.write(
        `
          MATCH (u:User {account_name: $account_name})
          OPTIONAL MATCH (old:Deposit {id: $id})
          CREATE (d:Deposit)
          SET d += $properties, d.id = randomUUID(), d.created_at = timestamp(), old.active = false
          CREATE (u)-[:DEPOSITED]->(d)
        `,
        {
          id: activeDeposit.id,
          account_name,
          properties: {
            amount_KPW: newDeposit,
            amount_USD,
            active: true,
          },
        },
      );
      // );
    } catch (error) {
      console.log('out', error);
    }
  }

  ////////////////////////////////////////////////////
  // Get user's buddy
  ////////////////////////////////////////////////////
  async getBuddy(account_name: string): Promise<string> {
    try {
      const res = await this.neo4jService.read(
        `
          MATCH (u1:User {account_name: $account_name})
          MATCH (u2)-[:REFERRED]->(u1)
          RETURN u2
        `,
        {
          account_name,
        },
      );

      const buddy =
        res.records.length > 0
          ? res.records[0]?.get('u2').properties.account_name
          : '';

      return buddy;
    } catch (error) {
      console.log('out', error);
      return '';
    }
  }

  ////////////////////////////////////////////////////
  // Get user's latest claim or deposit time
  ////////////////////////////////////////////////////
  async getLastActionTime(account_name: string): Promise<number> {
    try {
      const res = await this.neo4jService.read(
        `
          MATCH (u:User {account_name: $account_name})
          OPTIONAL MATCH (u)-[:DEPOSITED]->(d:Deposit {active: true})
          WITH u, d
          ORDER BY d.created_at DESC
          LIMIT 1
          OPTIONAL MATCH (u)-[:EARNED]->(n:Dividend {claimed: true})
          WITH u, d, n
          ORDER BY n.created_at DESC
          LIMIT 1
          RETURN COALESCE(n.created_at, d.created_at) AS latest_timestamp
        `,
        {
          account_name,
        },
      );

      return res.records[0].get('latest_timestamp');
    } catch (error) {
      console.log('out', error);
      return 0;
    }
  }

  ////////////////////////////////////////////////////
  // Calculate user's daily rewards
  ////////////////////////////////////////////////////
  async calculateReward(
    account_name: any,
    deposit_amount: number,
  ): Promise<number> {
    try {
      // Calculate reward
      const now = new Date().getTime();
      const last = await this.getLastActionTime(account_name);
      const days_passed = (now - last) / (1000 * 60 * 60 * 24);
      const reward_percentage = days_passed * constants.DAILY_REWARD_PERCENTAGE;

      console.log('last', last);
      console.log('rewardspercentage', reward_percentage);
      console.log('days_passed', days_passed);

      // Will need to see if earning rate is applicable

      // Calculte reward
      let reward = deposit_amount * reward_percentage;
      console.log('reward', reward);

      return reward;
    } catch (error) {
      console.log('out', error);
      return 0;
    }
  }

  amountToKPW = (amount: number): string =>
    (amount / 10000).toFixed(4) + ' KPW';
}
