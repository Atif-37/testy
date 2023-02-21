import { WebSocketGateway } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { BaseActionWatcher } from 'demux';
import { AlanodeActionReader } from 'demux-ala';
import { DemuxService } from './services/demux/demux.service';
import { ObjectActionHandlerService } from './services/object-action-handler/object-action-handler';

@WebSocketGateway()
export class AppGateway {
  constructor(private readonly demuxService: DemuxService) {}

  private logger: Logger = new Logger(AppGateway.name);

  onModuleInit() {
    this.logger.verbose('Gateway started');

    const actionHandler = new ObjectActionHandlerService([
      this.demuxService.handlerVersion,
    ]);

    const actionReader = new AlanodeActionReader({
      startAtBlock: 1,
      onlyIrreversible: true,
      alanodeEndpoint: 'http://127.0.0.1:8888',
    });

    const actionWatcher = new BaseActionWatcher(actionReader, actionHandler, 5);

    // actionWatcher.watch();
  }
}
