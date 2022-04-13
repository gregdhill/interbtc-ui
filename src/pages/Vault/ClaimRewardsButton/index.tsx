
import {
  useQuery,
  useMutation
} from 'react-query';
import {
  useErrorHandler,
  withErrorBoundary
} from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AccountId } from '@polkadot/types/interfaces';

import ErrorFallback from 'components/ErrorFallback';
import ErrorModal from 'components/ErrorModal';
import
InterlayDenimOrKintsugiSupernovaContainedButton
  from 'components/buttons/InterlayDenimOrKintsugiSupernovaContainedButton';
import {
  GOVERNANCE_TOKEN_SYMBOL,
  GovernanceTokenMonetaryAmount
} from 'config/relay-chains';
import { COLLATERAL_TOKEN_ID_LITERAL } from 'utils/constants/currency';
import { displayMonetaryAmount } from 'common/utils/utils';
import genericFetcher, { GENERIC_FETCHER } from 'services/fetchers/generic-fetcher';
import { StoreType } from 'common/types/util.types';

interface Props {
  // TODO: should remove `undefined` later on when the loading is properly handled
  vaultAccountId: AccountId | undefined;
}

const ClaimRewardsButton = ({
  vaultAccountId
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const { bridgeLoaded } = useSelector((state: StoreType) => state.general);

  const {
    isIdle: governanceTokenRewardIdle,
    isLoading: governanceTokenRewardLoading,
    data: governanceTokenReward,
    error: governanceTokenRewardError,
    refetch: governanceTokenRewardRefetch
  } = useQuery<GovernanceTokenMonetaryAmount, Error>(
    [
      GENERIC_FETCHER,
      'vaults',
      'getGovernanceReward',
      vaultAccountId,
      COLLATERAL_TOKEN_ID_LITERAL,
      GOVERNANCE_TOKEN_SYMBOL
    ],
    genericFetcher<GovernanceTokenMonetaryAmount>(),
    {
      enabled: !!bridgeLoaded && !!vaultAccountId
    }
  );
  useErrorHandler(governanceTokenRewardError);

  const claimRewardsMutation = useMutation<void, Error, void>(
    () => {
      return window.bridge.rewards.withdrawRewards(vaultAccountId);
    },
    {
      onSuccess: () => {
        governanceTokenRewardRefetch();
      }
    }
  );

  const handleClaimRewards = () => {
    claimRewardsMutation.mutate();
  };

  const initializing = (
    governanceTokenRewardIdle ||
    governanceTokenRewardLoading
  );
  let governanceTokenAmountLabel;
  if (initializing) {
    governanceTokenAmountLabel = '-';
  } else {
    if (governanceTokenReward === undefined) {
      throw new Error('Something went wrong!');
    }

    governanceTokenAmountLabel = displayMonetaryAmount(governanceTokenReward);
  }

  return (
    <>
      <InterlayDenimOrKintsugiSupernovaContainedButton
        disabled={initializing}
        onClick={handleClaimRewards}
        pending={claimRewardsMutation.isLoading}>
        {t('vault.claim_governance_token_rewards', {
          governanceTokenAmount: governanceTokenAmountLabel,
          governanceTokenSymbol: GOVERNANCE_TOKEN_SYMBOL
        })}
      </InterlayDenimOrKintsugiSupernovaContainedButton>
      {claimRewardsMutation.isError && (
        <ErrorModal
          open={claimRewardsMutation.isError}
          onClose={() => {
            claimRewardsMutation.reset();
          }}
          title='Error'
          description={
            claimRewardsMutation.error?.message ||
            ''
          } />
      )}
    </>
  );
};

export default withErrorBoundary(ClaimRewardsButton, {
  FallbackComponent: ErrorFallback,
  onReset: () => {
    window.location.reload();
  }
});
