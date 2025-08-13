import { Module } from '@nestjs/common';
import { SessionStoreService } from './session-store.service';

@Module({
  providers: [SessionStoreService],
  exports: [SessionStoreService], // so other modules can use it
})
export class SessionStorageModule {}
