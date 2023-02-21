import { Injectable } from '@nestjs/common';
import { constants } from 'src/constants';
import { DepositService } from 'src/deposit/deposit.service';

@Injectable()
export class DemuxService {
  constructor(private readonly depositService: DepositService) {}

  private updaters = [
    {
      actionType: 'eosio.token::transfer',
      apply: (state, payload, blockInfo, context) => {
        this.updateTransferData(state, payload, blockInfo, context);
        if (
          payload?.data?.to == constants.CONTRACT &&
          payload?.data?.from != constants.CONTRACT
        ) {
          this.depositService.addDeposit(payload?.data?.from);
        }
      },
    },
  ];

  private effects = [
    {
      actionType: 'eosio.token::transfer',
      run: this.logUpdate,
    },
  ];

  public handlerVersion = {
    versionName: 'v1',
    updaters: this.updaters,
    effects: this.effects,
  };

  updateTransferData(state, payload, blockInfo, context) {
    if (payload?.data?.to == constants.CONTRACT) {
      console.log('Data from payload', payload.data);
      // console.log(' payload', { payload });
    }

    const [amountString, symbol] = payload.data.quantity.split(' ');
    const amount = parseFloat(amountString);

    if (!state.volumeBySymbol[symbol]) {
      state.volumeBySymbol[symbol] = amount;
    } else {
      state.volumeBySymbol[symbol] += amount;
    }
    state.totalTransfers += 1;
    context.stateCopy = JSON.parse(JSON.stringify(state)); // Deep copy state to de-reference
  }

  logUpdate(payload, blockInfo, context) {
    // console.info(
    //   'State updated:\n',
    //   JSON.stringify(context.stateCopy, null, 2),
    // );
  }

  updateState() {}
}
