import { BadRequestException, Injectable } from '@nestjs/common';
// import { Neo4jService } from 'src/neo4j/neo4j.service';
import { Neo4jService } from 'nest-neo4j';
import * as bcrypt from 'bcrypt';
import { constants } from 'src/constants';
import { AlaioService } from 'src/services/alaio/alaio.service';

@Injectable()
export class UserService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly alaioService: AlaioService,
  ) {}

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
  // Get users
  ////////////////////////////////////////////////////
  async getUsers(params): Promise<any> {
    const readParams: Record<string, any> = {
      skip: this.neo4jService.int(parseInt(params.offset) || 0),
      limit: this.neo4jService.int(parseInt(params.limit) || 10),
    };

    const where = ['u.created_at > 0'];

    if (params.id) {
      readParams.id = params.id;
    }

    if (params.account_name) {
      readParams.account_name = params.account_name;
    }

    const query = `
    Match (u:User 
      ${params.id ? `{id: $id}` : ''}
      ${params.account_name ? `{account_name: $account_name}` : ''}
    ) 
    OPTIONAL MATCH (u)-[:ADVERTISER]-(a:Advertiser)
    OPTIONAL MATCH (u)-[:INFLUENCER]-(i:Influencer)
    OPTIONAL MATCH (a)-[:OWNS]->(c:Campaign)
    OPTIONAL MATCH (c)<-[:PROMOTING]->(inf:Influencer)
    OPTIONAL MATCH (user:User)-[:CONSUMED]->(c)
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    RETURN u, a, i, count(distinct c) as Campaigns,
    count(distinct inf) as Promoted, count(distinct user) as Consumed
    ${
      !params.id && !params.account_name
        ? `ORDER BY u.created_at DESC SKIP $skip LIMIT $limit`
        : ''
    }
     `;

    console.log(query);

    try {
      const res = await this.neo4jService.read(query, readParams);
      return {
        status: 200,
        result:
          res.records.length > 0
            ? res.records.map((a) => ({
                ...a.get('u').properties,
                brand_details: a.get('a')?.properties || null,
                influencer_details: a.get('i')?.properties || null,
                campaigns: a.get('Campaigns') || null,
                promoted: a.get('Promoted') || null,
                consumed: a.get('Consumed') || null,
              }))
            : [],
      };
    } catch (error) {
      console.log('out', error);
      return { status: 400, message: error.message };
    }
  }

  ////////////////////////////////////////////////////
  // Add user
  ////////////////////////////////////////////////////
  async addUser(props): Promise<any> {
    const pin_hash = await bcrypt.hash(
      props.pin,
      parseInt(process.env.HASH_ROUNDS),
    );
    try {
      const res = await this.neo4jService.write(
        `
          CREATE (u:User)
          SET u += $properties, u.id = randomUUID(), u.created_at = timestamp()
          return u
        `,
        {
          properties: {
            pin_hash,
            account_name: props.account_name,
            current_role: props.current_role,
            rank: 0,
          },
        },
      );
      return res.records.length == 1
        ? { status: 200, result: res.records[0].get('u')?.properties }
        : { status: 400, message: 'Unable to create user', result: undefined };
    } catch (error) {
      console.log('out', error);
      return { status: 400, message: error.message, result: undefined };
    }
  }

  ////////////////////////////////////////////////////
  // Update user's pin
  ////////////////////////////////////////////////////
  async updatePin(props): Promise<any> {
    const pin_hash = await bcrypt.hash(
      props.new_pin,
      parseInt(process.env.HASH_ROUNDS),
    );

    console.log('props =>', {
      pin_hash,
      id: props.id,
    });

    try {
      const res = await this.neo4jService.write(
        `
        MATCH (u:User {id: $id})
        SET u.pin_hash = $pin_hash
        RETURN u
        `,
        {
          pin_hash,
          id: props.id,
        },
      );
      return res.records.length == 1
        ? { status: 200, message: 'Pin updated successfully.' }
        : { status: 400, message: 'Unable to create user', result: undefined };
    } catch (error) {
      console.log('out', error);
      return { status: 400, message: error.message, result: undefined };
    }
  }

  ////////////////////////////////////////////////////
  // Update user profile
  ////////////////////////////////////////////////////
  async updateUser(id: string, properties: any): Promise<any> {
    try {
      const res = await this.neo4jService.write(
        `
          MATCH (u:User {id: $id})
          SET u += $properties
          return u
        `,
        {
          id,
          properties,
        },
      );

      return res.records.length == 1
        ? { status: 200, result: res.records[0].get('u').properties }
        : { status: 400, message: 'Unable to update user' };
    } catch (error) {
      console.log('out', error);
      throw { status: 400, message: error.message };
    }
  }

  ////////////////////////////////////////////////////
  // Delete user profile
  ////////////////////////////////////////////////////
  async deleteUser(id: string): Promise<any> {
    try {
      const res = await this.neo4jService.write(
        `
        MATCH (u:User {id: $id})
        SET u = {id: u.id}
        REMOVE u:User
        SET u:Deleted
        RETURN u
        `,
        {
          id,
        },
      );

      return res.records.length == 1
        ? { status: 200, message: 'User has been deleted successfully.' }
        : { status: 400, message: 'Unable to delete user' };
    } catch (error) {
      console.log('out', error);
      throw { status: 400, message: error.message };
    }
  }

  ////////////////////////////////////////////////////
  // Find user by account name
  ////////////////////////////////////////////////////
  async findByAccountName(account_name: string): Promise<any> {
    try {
      const res = await this.neo4jService.read(
        `
          MATCH (u:User {account_name: $account_name})
          return u
        `,
        {
          account_name,
        },
      );
      return res.records.length == 1
        ? res.records[0].get('u').properties
        : undefined;
    } catch (error) {
      console.log('out', error);
      return undefined;
    }
  }

  ////////////////////////////////////////////////////
  // Add buddy
  ////////////////////////////////////////////////////
  async addBuddy(props: any): Promise<any> {
    if (props.account_name === props.buddy)
      throw new BadRequestException('Invalid buddy account name');

    if (props.buddy != constants.CONTRACT) {
      const isDepositActive = await this.doesUserHaveActiveDeposit(props.buddy);

      if (!isDepositActive)
        throw new BadRequestException('Buddy does not have an active deposit.');
    }

    console.log(props);

    const res = await this.alaioService
      .pushTransaction(
        'addbuddy',
        constants.CONTRACT,
        {
          user: props.account_name,
          buddy: props.buddy,
        },
        constants.CONTRACT,
      )
      .catch((e) => {
        throw new BadRequestException(
          e.details ? e.details[0]?.message : e.message,
        );
      });

    await this.neo4jService.write(
      `
        MATCH (u1:User {account_name: $user})
        MATCH (u2:User {account_name: $buddy})
        CREATE (u2)-[:REFERRED]->(u1)
      `,
      {
        user: props.account_name,
        buddy: props.buddy,
      },
    );

    return {
      status: 200,
      action_details: res,
      message: 'Buddy has been added successfully.',
    };
  }
}
