import * as React from 'react';
import { useQuery, UseQueryResult } from 'react-query';
import { useSelector } from 'react-redux';
import { AccountId } from '@polkadot/types/interfaces';
import { CurrencyUnit, ChainBalance } from '@interlay/interbtc-api';
import { Currency } from '@interlay/monetary-js';

import { GOVERNANCE_TOKEN, GovernanceToken } from 'config/relay-chains';
import useAccountId from 'utils/hooks/use-account-id';
import genericFetcher, { GENERIC_FETCHER } from 'services/fetchers/generic-fetcher';
import { StoreType } from 'common/types/util.types';

type ChainTokenBalance = ChainBalance<CurrencyUnit>;

type UseTokenBalance = UseQueryResult<ChainTokenBalance, Error>;

// `D` stands for Decimals
const useTokenBalance = <D extends CurrencyUnit>(
  token: Currency<D>,
  accountAddress: string | undefined
): UseTokenBalance => {
  const { bridgeLoaded } = useSelector((state: StoreType) => state.general);

  const accountId = useAccountId(accountAddress);

  return useQuery<ChainTokenBalance, Error>(
    [GENERIC_FETCHER, 'tokens', 'balance', token, accountId],
    genericFetcher<ChainTokenBalance>(),
    {
      enabled: !!bridgeLoaded && !!accountId
    }
  );
};

const useGovernanceTokenBalance = (accountAddress?: string): UseTokenBalance => {
  return useTokenBalance(GOVERNANCE_TOKEN, accountAddress);
};

const useGovernanceTokenBalanceQueryKey = (
  accountAddress?: string
): [string, string, string, GovernanceToken, AccountId] | undefined => {
  const accountId = useAccountId(accountAddress);

  return React.useMemo(() => {
    if (!accountId) return;

    return [GENERIC_FETCHER, 'tokens', 'balance', GOVERNANCE_TOKEN, accountId];
  }, [accountId]);
};

export { useGovernanceTokenBalance, useGovernanceTokenBalanceQueryKey };

export default useTokenBalance;
