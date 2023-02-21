import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j/dist';

@Injectable()
export class DashboardService {
  constructor(private readonly neo4jService: Neo4jService) {}

  ////////////////////////////////////////////////////
  // Get user's dividends
  ////////////////////////////////////////////////////
  async getDashboard(account_name: string): Promise<any> {
    // const res = await this.neo4jService.read(
    //   `
    //   MATCH (u:User {account_name: $account_name})-[:EARNED]->(d:Dividend)
    //   RETURN d
    // `,
    //   {
    //     account_name,
    //   },
    // );

    return {
      available_dividend: 0,
      available_ref_bonus: 0,
      available_match_bonus: 0,
      daily_dividend: 0,
      total_deposit: 0,
      active_deposit: 0,
      earnable: 0,
      max_payout: 0,
      total_withdrawn: 0,
      no_referrals: 0,
      total_team: 0,
    };
  }

  ////////////////////////////////////////////////////
  // Get user's dividends
  ////////////////////////////////////////////////////
  async getDividends(account_name: string): Promise<any> {
    const res = await this.neo4jService.read(
      `
      MATCH (u:User {account_name: $account_name})-[:EARNED]->(d:Dividend)
      RETURN d
    `,
      {
        account_name,
      },
    );

    return res.records.length > 0
      ? res.records.map((item) => ({
          ...item.get('d').properties,
        }))
      : [];
  }

  ////////////////////////////////////////////////////
  // Get user's deposits
  ////////////////////////////////////////////////////
  async getDeposits(account_name: string): Promise<any> {
    const res = await this.neo4jService.read(
      `
      MATCH (u:User {account_name: $account_name})-[:DEPOSITED]->(d:Deposit)
      RETURN d
    `,
      {
        account_name,
      },
    );

    return res.records.length > 0
      ? res.records.map((item) => ({
          ...item.get('d').properties,
        }))
      : [];
  }

  ////////////////////////////////////////////////////
  // Get user's matches
  ////////////////////////////////////////////////////
  async getMatches(account_name: string): Promise<any> {
    const res = await this.neo4jService.read(
      `
      MATCH (u:User {account_name: $account_name})-[:EARNED]->(m:Match)
      RETURN m
    `,
      {
        account_name,
      },
    );

    return res.records.length > 0
      ? res.records.map((item) => ({
          ...item.get('m').properties,
        }))
      : [];
  }

  ////////////////////////////////////////////////////
  // Get user's referrals
  ////////////////////////////////////////////////////
  async getReferrals(account_name: string): Promise<any> {
    const res = await this.neo4jService.read(
      `
      MATCH (u:User {account_name: $account_name})-[:EARNED]->(r:Referral)
      RETURN r
    `,
      {
        account_name,
      },
    );

    return res.records.length > 0
      ? res.records.map((item) => ({
          ...item.get('r').properties,
        }))
      : [];
  }

  ////////////////////////////////////////////////////
  // Get user's withdrawals
  ////////////////////////////////////////////////////
  async getWithdrawals(account_name: string): Promise<any> {
    const res = await this.neo4jService.read(
      `
      MATCH (u:User {account_name: $account_name})-[:WITHDREW]->(w:Withdrawal)
      RETURN w
    `,
      {
        account_name,
      },
    );

    return res.records.length > 0
      ? res.records.map((item) => ({
          ...item.get('w').properties,
        }))
      : [];
  }
}
