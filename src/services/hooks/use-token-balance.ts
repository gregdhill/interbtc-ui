import { ChainBalance, CurrencyUnit, GovernanceUnit } from '@interlay/interbtc-api';
import { Currency } from '@interlay/monetary-js';
import { AccountId } from '@polkadot/types/interfaces';
import * as React from 'react';
import { useQuery, UseQueryResult } from 'react-query';
import { useSelector } from 'react-redux';

import { StoreType } from '@/common/types/util.types';
import { GOVERNANCE_TOKEN, GovernanceToken } from '@/config/relay-chains';
import genericFetcher, { GENERIC_FETCHER } from '@/services/fetchers/generic-fetcher';
import useAccountId from '@/utils/hooks/use-account-id';

const useTokenBalance = <T extends CurrencyUnit>(
  token: Currency<T>,
  accountAddress: string | undefined
): UseQueryResult<ChainBalance<T>, Error> => {
  const { bridgeLoaded } = useSelector((state: StoreType) => state.general);

  const accountId = useAccountId(accountAddress);

  // ray test touch <
  return useQuery<ChainBalance<T>, Error>(
    [GENERIC_FETCHER, 'tokens', 'balance', token, accountId],
    genericFetcher<ChainBalance<T>>(),
    {
      enabled: !!bridgeLoaded && !!accountId
    }
  );
  // ray test touch >
};

const useGovernanceTokenBalance = (accountAddress?: string): UseQueryResult<ChainBalance<GovernanceUnit>, Error> => {
  // ray test touch <
  return useTokenBalance<GovernanceUnit>(GOVERNANCE_TOKEN, accountAddress);
  // ray test touch >
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
