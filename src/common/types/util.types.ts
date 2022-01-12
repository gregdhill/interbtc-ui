import { Store, CombinedState } from 'redux';
import { GeneralActions, RedeemActions, IssueActions, VaultActions } from './actions.types';
import { rootReducer } from '../reducers/index';
import { u256 } from '@polkadot/types/primitive';
import { IssueState } from './issue.types';
import { RedeemState } from './redeem.types';
import { VaultState } from './vault.types';
import {
  BitcoinAmount,
  MonetaryAmount,
  Currency,
  BitcoinUnit,
  Polkadot
} from '@interlay/monetary-js';
import {
  CollateralUnit,
  CurrencyUnit
} from '@interlay/interbtc-api';

export interface StatusUpdate {
  id: u256;
  timestamp: string;
  proposedStatus: string;
  currentStatus: string;
  proposedChanges: string;
  blockHash: string;
  // eslint-disable-next-line camelcase
  aye_vote_stake: string;
  // eslint-disable-next-line camelcase
  nay_vote_stake: string;
  result: string;
  proposer: string;
  message: string;
}

export interface DashboardStatusUpdateInfo {
  id: string;
  timestamp: string;
  proposedStatus: string;
  addError: string;
  removeError: string;
  // eslint-disable-next-line camelcase
  btcBlockHash: string;
  yeas: number;
  nays: number;
  executed: boolean;
  rejected: boolean;
  forced: boolean;
}

export enum ParachainStatus {
  Loading,
  Error,
  Running,
  Shutdown
}

export type Prices = {
  bitcoin: {
    usd: number;
  };
  collateralToken: {
    usd: number;
  };
};

export type GeneralState = {
  bridgeLoaded: boolean;
  vaultClientLoaded: boolean;
  showAccountModal: boolean;
  address: string;
  totalWrappedTokenAmount: BitcoinAmount;
  totalLockedCollateralTokenAmount: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
  wrappedTokenBalance: BitcoinAmount;
  collateralTokenBalance: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
  extensions: string[];
  btcRelayHeight: number;
  bitcoinHeight: number;
  parachainStatus: ParachainStatus;
  prices: Prices;
};

export type AppState = ReturnType<typeof rootReducer>;

export type StoreType = {
  general: GeneralState;
  issue: IssueState;
  redeem: RedeemState;
  vault: VaultState;
};

export type dispatcher = {
  // eslint-disable-next-line
  dispatch: {};
};

export type StoreState = Store<CombinedState<StoreType>, GeneralActions | RedeemActions | IssueActions | VaultActions> &
  dispatcher;

export type TimeDataPoint = {
  x: Date;
  y: number;
};

export type RelayedBlock = {
  height: string;
  hash: string;
  // eslint-disable-next-line camelcase
  relayTs: string;
};

export type WrappedToken = Currency<BitcoinUnit>;
export type CollateralToken = Polkadot;
export type GovernanceToken = Currency<CurrencyUnit>;

// TODO (this ticket): only need one of these types
export enum TempTokenType { WrappedToken, CollateralToken }

export enum TokenType {
  COLLATERAL = 'collateral',
  GOVERNANCE = 'governance',
  WRAPPED = 'wrapped'
}
