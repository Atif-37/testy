import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j/dist';
import { GetReferralDto } from './dto';

@Injectable()
export class ReferralService {
  constructor(private readonly neo4jService: Neo4jService) {}

  ////////////////////////////////////////////////////
  // Create a user's referral bonus
  ////////////////////////////////////////////////////
  async addReferralBonus(account_name: any, amount: number): Promise<void> {
    // convert KPW amount to USD
    const amount_USD = amount;

    try {
      await this.neo4jService.write(
        `
          MATCH (u:User {account_name: $account_name})
          CREATE (r:Referral)
          SET r += $properties, r.id = randomUUID(), r.created_at = timestamp()
          CREATE (u)-[:EARNED]->(r)
        `,
        {
          account_name,
          properties: {
            amount_KPW: amount,
            amount_USD,
            claimed: false,
          },
        },
      );
    } catch (e) {
      console.log('out', e);
    }
  }

  ////////////////////////////////////////////////////
  // Mark user's all referrals as claimed
  ////////////////////////////////////////////////////
  async markReferralsAsClaimed(account_name: any): Promise<void> {
    try {
      await this.neo4jService.write(
        `
          MATCH (:User {account_name: $account_name})-[:EARNED]->(r:Referral)
          SET r.claimed = true
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
  // Get a user's unclaimed referral bonus
  ////////////////////////////////////////////////////
  async getUnclaimedReferralBonus(account_name: any): Promise<number> {
    try {
      const res = await this.neo4jService.read(
        `
          MATCH (u:User {account_name: $account_name})-[:EARNED]->(r:Referral {claimed: false})
          RETURN SUM(r.amount_KPW) AS total_amount
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
  getReferralBonus = async (params: GetReferralDto): Promise<any> => {
    const readParams: any = {
      skip: this.neo4jService.int(parseInt(params.offset) || 0),
      limit: this.neo4jService.int(parseInt(params.limit) || 10),
    };

    let query;

    if (params.account_name) {
      query = `MATCH (a:Advertiser)-[:OWNS]->(c:Campaign {id:$id})`;
      readParams.account_name = params.account_name;
    } else if (params.claimed) {
      query = `MATCH (a:Advertiser)-[:OWNS]->(c:Campaign {id:$id})`;
      readParams.claimed = params.claimed;
    } else {
      query = `MATCH (a:Advertiser)-[:OWNS]->(c:Campaign)`;
    }

    query += `
      OPTIONAL MATCH (c)<-[:CONSUMED]-(u:User)
      OPTIONAL MATCH (c)<-[:PROMOTING]-(i:Influencer)

      RETURN c, a, count(distinct u) AS reach, collect(i) as influencers
      ORDER BY c.created_at DESC SKIP $skip LIMIT $limit
    `;

    console.log(query);

    const res = await this.neo4jService.read(query, readParams);

    return res.records.length > 0
      ? res.records.map((item) => ({
          ...item.get('c').properties,
          reach: item.get('reach'),
          brand: item.get('a')?.properties,
          influencers: item.get('influencers').map((inf) => inf?.properties),
        }))
      : [];
  };
}
