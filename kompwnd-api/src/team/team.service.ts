import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j/dist';
import { DashboardService } from 'src/dashboard/dashboard.service';
import { UserService } from 'src/user/user.service';
import { GetTeamDataDto, GetTeamDto } from './dto';

@Injectable()
export class TeamService {
  iteration = 1;
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly dashboardService: DashboardService,
    private readonly userService: UserService,
  ) {}

  ////////////////////////////////////////////////////
  // Get team
  ////////////////////////////////////////////////////
  getTeam = async (params: GetTeamDto): Promise<any> => {
    const readParams: any = {
      ...params,
    };

    if (params.limit) {
      readParams.limit = this.neo4jService.int(parseInt(params.limit));
    }

    const root = await this.userService.findByAccountName(params.account_name);

    return {
      ...root,
      children: await this.getUsersBuddies(readParams.account_name),
    };
  };

  ////////////////////////////////////////////////////
  // Get team deposit
  ////////////////////////////////////////////////////
  getDeposit = async (params: GetTeamDataDto): Promise<any> => {
    const readParams: any = {
      account_name: params.account_name,
      // skip: this.neo4jService.int(parseInt(params.offset) || 0),
      // limit: this.neo4jService.int(parseInt(params.limit) || 10),
    };

    const deposits = await this.dashboardService.getDeposits(
      params.account_name,
    );

    const teamRes = await this.neo4jService.read(
      `
        MATCH path = (u:User {account_name: $account_name})-[:REFERRED*1..15]->(descendant:User)
        WITH descendant, length(path)-1 AS level
        MATCH (descendant)-[:DEPOSITED]->(d:Deposit)
        WITH level, count(DISTINCT descendant) as no_users, sum(d.amount_KPW) as deposit
        RETURN {level: level + 1, no_users: no_users, deposit: deposit} as result
        ORDER BY result.level ASC
      `,
      readParams,
    );

    return {
      deposits,
      team:
        teamRes.records.length > 0
          ? teamRes.records.map((item) => {
              console.log(item.get('result'));
              return {
                ...item.get('result'),
              };
            })
          : [],
    };
  };

  ////////////////////////////////////////////////////
  // Get team earning
  ////////////////////////////////////////////////////
  getEarning = async (params: GetTeamDataDto): Promise<any> => {
    const readParams: any = {
      account_name: params.account_name,
      // skip: this.neo4jService.int(parseInt(params.offset) || 0),
      // limit: this.neo4jService.int(parseInt(params.limit) || 10),
    };

    const withdrawals = await this.dashboardService.getWithdrawals(
      params.account_name,
    );

    const teamRes = await this.neo4jService.read(
      `
        MATCH path = (u:User {account_name: $account_name})-[:REFERRED*1..15]->(descendant:User)
        WITH descendant, length(path)-1 AS level
        MATCH (descendant)-[:WITHDREW]->(w:Withdrawal)
        WITH level, count(DISTINCT descendant) as no_users, sum(w.amount_KPW) as total, sum(w.dividend_KPW) as dividend, sum(w.match_KPW) as match, sum(w.referral_KPW) as referral
        RETURN {level: level + 1, no_users: no_users, total: total, dividend: dividend, match: match, referral: referral} as result
        ORDER BY result.level ASC
      `,
      readParams,
    );

    return {
      withdrawals,
      team:
        teamRes.records.length > 0
          ? teamRes.records.map((item) => {
              console.log(item.get('result'));
              return {
                ...item.get('result'),
              };
            })
          : [],
    };
  };

  ////////////////////////////////////////////////////
  // Get team rank
  ////////////////////////////////////////////////////
  getRank = async (params: GetTeamDataDto): Promise<any> => {
    const readParams: any = {
      account_name: params.account_name,
      // skip: this.neo4jService.int(parseInt(params.offset) || 0),
      // limit: this.neo4jService.int(parseInt(params.limit) || 10),
    };

    const deposit = await this.neo4jService.read(
      `
        MATCH (u:User {account_name: $account_name})-[:DEPOSITED]->(d:Deposit)
        RETURN SUM(d.amount_KPW) AS deposit
      `,
      readParams,
    );

    const rank = await this.neo4jService.read(
      `
      MATCH (u:User {account_name: $account_name})
      RETURN u.rank AS rank
    `,
      readParams,
    );

    const teamDeposit = await this.neo4jService.read(
      `
        MATCH path = (u:User {account_name: $account_name})-[:REFERRED*1..15]->()-[:DEPOSITED]->(d:Deposit)
        WITH path, reduce(total = 0, dep in collect(d.amount_KPW) | total + dep) AS generationDeposit
        RETURN sum(generationDeposit) AS totalDeposits
      `,
      readParams,
    );

    const teamRes = await this.neo4jService.read(
      `
        MATCH path = (u:User {account_name: $account_name})-[:REFERRED*1..15]->(descendant:User)
        WITH descendant, length(path) AS level
        WITH level, descendant
        RETURN {level: level, account_name: descendant.account_name, rank: descendant.rank} as result
        ORDER BY result.level ASC
      `,
      readParams,
    );

    return {
      user: {
        teamDeposit: teamDeposit.records[0]?.get('totalDeposits'),
        rank: rank.records[0]?.get('rank'),
        deposit: deposit.records[0]?.get('deposit'),
      },
      team:
        teamRes.records.length > 0
          ? teamRes.records.map((item) => {
              console.log(item.get('result'));
              return {
                ...item.get('result'),
              };
            })
          : [],
    };
  };

  ////////////////////////////////////////////////////
  // Get user's buddies
  ////////////////////////////////////////////////////
  getUsersBuddies = async (account_name: string): Promise<any> => {
    console.log('iteration =>', this.iteration++);
    const buddies = await this.neo4jService.read(
      `
      MATCH (:User {account_name: $account_name})-[:REFERRED]->(u:User)
      RETURN collect(u) as buddies      
      `,
      { account_name },
    );

    const children = await Promise.all(
      buddies.records[0].get('buddies').map(async (item) => ({
        ...item.properties,
        children: await this.getUsersBuddies(item.properties.account_name),
      })),
    );

    return children;
  };
}
