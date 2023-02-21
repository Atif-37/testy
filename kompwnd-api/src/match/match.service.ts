import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j/dist';
import { constants } from 'src/constants';
import { SharedService } from 'src/services/shared/shared.service';
import { GetMatchDto } from './dto';

@Injectable()
export class MatchService {
  matchBonusPercent = [
    0.1, 0.05, 0.04, 0.04, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.02,
    0.02, 0.02,
  ];
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly sharedService: SharedService,
  ) {}

  ////////////////////////////////////////////////////
  // Create a user's match bonus
  ////////////////////////////////////////////////////
  async addMatchBonus(
    account_name: any,
    amount: number,
    generation: number,
  ): Promise<void> {
    // convert KPW amount to USD
    const amount_USD = amount;

    try {
      await this.neo4jService.write(
        `
          MATCH (u:User {account_name: $account_name})
          CREATE (m:Match)
          SET m += $properties, m.id = randomUUID(), m.created_at = timestamp()
          CREATE (u)-[:EARNED]->(m)
        `,
        {
          account_name,
          properties: {
            amount_KPW: amount,
            amount_USD,
            claimed: false,
            generation,
          },
        },
      );
    } catch (e) {
      console.log('out', e);
    }
  }

  ////////////////////////////////////////////////////
  // Mark user's all matches as claimed
  ////////////////////////////////////////////////////
  async markMatchesAsClaimed(account_name: any): Promise<void> {
    try {
      await this.neo4jService.write(
        `
          MATCH (:User {account_name: $account_name})-[:EARNED]->(m:Match)
          SET m.claimed = true
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
  // Get a user's unclaimed match bonus
  ////////////////////////////////////////////////////
  async getUnclaimedMatchBonus(account_name: any): Promise<number> {
    try {
      const res = await this.neo4jService.read(
        `
          MATCH (u:User {account_name: $account_name})-[:EARNED]->(m:Match {claimed: false})
          RETURN SUM(m.amount_KPW) AS total_amount
        `,
        {
          account_name,
        },
      );

      return res.records[0].get('total_amount');
    } catch (e) {
      console.log('out', e);
      return 0;
    }
  }

  ////////////////////////////////////////////////////
  // Get referral bonuses
  ////////////////////////////////////////////////////
  async getMatchBonus(params: GetMatchDto): Promise<any> {
    const readParams: any = {};
    if (params.account_name) {
      readParams.account_name = params.account_name;
    }
    if (params.claimed) {
      readParams.claimed = params.claimed == 'true' ? true : false;
    }
    if (params.offset) {
      readParams.skip = this.neo4jService.int(parseInt(params.offset) || 0);
    }
    if (params.limit) {
      readParams.limit = this.neo4jService.int(parseInt(params.limit) || 10);
    }

    let query = `
    MATCH (u:User${
      params.account_name ? ' {account_name: $account_name}' : ''
    })-[:EARNED]->(m:Match${params.claimed ? ' {claimed: $claimed}' : ''})
    RETURN m
    ORDER BY m.created_at DESC${params.offset ? ' SKIP $skip' : ''}${
      params.limit ? ' LIMIT $limit' : ''
    }
    `;

    const res = await this.neo4jService.read(query, readParams);

    return res.records.length > 0
      ? res.records.map((item) => ({
          ...item.get('m').properties,
        }))
      : [];
  }

  ////////////////////////////////////////////////////
  // Emplace match bonuses for upline buddies
  ////////////////////////////////////////////////////
  async emplaceMatches(
    account_name: string,
    reward: number,
    generation: number,
  ): Promise<void> {
    try {
      // Get buddy
      const buddy = await this.sharedService.getBuddy(account_name);

      // Create match bonus for upline buddies till 15th gen
      if (
        generation > 0 &&
        generation <= 15 &&
        account_name != constants.CONTRACT
      ) {
        // Calculate match bonus
        const matchBonus = reward * this.matchBonusPercent[generation - 1];

        // Create match bonus
        await this.addMatchBonus(account_name, matchBonus, generation);

        // Call emplace match for buddy
        await this.emplaceMatches(buddy, reward, generation + 1);
      } else if (generation == 0) {
        // Call emplace match for buddy
        await this.emplaceMatches(buddy, reward, generation + 1);
      } else {
        return;
      }
    } catch (e) {
      console.log('out', e);
    }
  }
}
