
import * as React from 'react';
import {
  useDispatch,
  useSelector
} from 'react-redux';
import {
  useQuery,
  useMutation
} from 'react-query';
import {
  useErrorHandler,
  withErrorBoundary
} from 'react-error-boundary';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AddressOrPair } from '@polkadot/api/types';
import {
  format,
  add
} from 'date-fns';
import Big from 'big.js';
import clsx from 'clsx';
import {
  MonetaryAmount,
  Currency
} from '@interlay/monetary-js';
import {
  DefaultTransactionAPI,
  GovernanceUnit,
  newMonetaryAmount,
  VoteUnit
} from '@interlay/interbtc-api';

import Title from './Title';
import BalancesUI from './BalancesUI';
import WithdrawButton from './WithdrawButton';
import ClaimRewardsButton from './ClaimRewardsButton';
import AvailableBalanceUI from './AvailableBalanceUI';
import InformationUI from './InformationUI';
import LockTimeField from './LockTimeField';
import MainContainer from 'parts/MainContainer';
import Panel from 'components/Panel';
import TokenField from 'components/TokenField';
import SubmitButton from 'components/SubmitButton';
import ErrorFallback from 'components/ErrorFallback';
import ErrorModal from 'components/ErrorModal';
import InterlayTooltip from 'components/UI/InterlayTooltip';
import {
  VOTE_GOVERNANCE_TOKEN_SYMBOL,
  GOVERNANCE_TOKEN_SYMBOL,
  VOTE_GOVERNANCE_TOKEN,
  GOVERNANCE_TOKEN,
  STAKE_LOCK_TIME
} from 'config/relay-chains';
import { BLOCK_TIME } from 'config/parachain';
import { YEAR_MONTH_DAY_PATTERN } from 'utils/constants/date-time';
import {
  displayMonetaryAmount,
  getUsdAmount
} from 'common/utils/utils';
import genericFetcher, { GENERIC_FETCHER } from 'services/fetchers/generic-fetcher';
import { StoreType } from 'common/types/util.types';
import { showAccountModalAction } from 'common/actions/general.actions';
import { ReactComponent as InformationCircleIcon } from 'assets/img/hero-icons/information-circle.svg';

const getLockBlocks = (weeks: number) => {
  return (weeks * 7 * 24 * 3600) / BLOCK_TIME;
};

const ZERO_VOTE_GOVERNANCE_TOKEN_AMOUNT = newMonetaryAmount(0, VOTE_GOVERNANCE_TOKEN, true);
const ZERO_GOVERNANCE_TOKEN_AMOUNT = newMonetaryAmount(0, GOVERNANCE_TOKEN, true);

const LOCKING_AMOUNT = 'locking-amount';
const LOCK_TIME = 'lock-time';

type StakingFormData = {
  [LOCKING_AMOUNT]: string;
  [LOCK_TIME]: string;
}

interface RewardAmountAndAPY {
  amount: MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>;
  apy: number;
}

interface StakedAmountAndEndBlock {
  amount: MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>;
  endBlock: number;
}

interface LockingAmountAndTime {
  amount: MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>;
  time: number; // Weeks
}

const Staking = (): JSX.Element => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const {
    governanceTokenBalance,
    governanceTokenTransferableBalance,
    bridgeLoaded,
    address,
    prices
  } = useSelector((state: StoreType) => state.general);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    trigger
  } = useForm<StakingFormData>({
    mode: 'onChange', // 'onBlur'
    defaultValues: {
      [LOCKING_AMOUNT]: '0',
      [LOCK_TIME]: '0'
    }
  });
  const lockingAmount = watch(LOCKING_AMOUNT) || '0';
  const lockTime = watch(LOCK_TIME) || '0';

  const {
    isIdle: currentBlockNumberIdle,
    isLoading: currentBlockNumberLoading,
    data: currentBlockNumber,
    error: currentBlockNumberError
  } = useQuery<number, Error>(
    [
      GENERIC_FETCHER,
      'interBtcApi',
      'system',
      'getCurrentBlockNumber'
    ],
    genericFetcher<number>(),
    {
      enabled: !!bridgeLoaded
    }
  );
  useErrorHandler(currentBlockNumberError);

  const {
    isIdle: voteGovernanceTokenBalanceIdle,
    isLoading: voteGovernanceTokenBalanceLoading,
    data: voteGovernanceTokenBalance,
    error: voteGovernanceTokenBalanceError,
    refetch: voteGovernanceTokenBalanceRefetch
  } = useQuery<MonetaryAmount<Currency<VoteUnit>, VoteUnit>, Error>(
    [
      GENERIC_FETCHER,
      'interBtcApi',
      'escrow',
      'votingBalance',
      address
    ],
    genericFetcher<MonetaryAmount<Currency<VoteUnit>, VoteUnit>>(),
    {
      enabled: !!bridgeLoaded
    }
  );
  useErrorHandler(voteGovernanceTokenBalanceError);

  // My Rewards
  const {
    isIdle: rewardAmountAndAPYIdle,
    isLoading: rewardAmountAndAPYLoading,
    data: rewardAmountAndAPY,
    error: rewardAmountAndAPYError
  } = useQuery<RewardAmountAndAPY, Error>(
    [
      GENERIC_FETCHER,
      'interBtcApi',
      'escrow',
      'getRewardEstimate',
      address
    ],
    genericFetcher<RewardAmountAndAPY>(),
    {
      enabled: !!bridgeLoaded
    }
  );
  useErrorHandler(rewardAmountAndAPYError);

  // Estimated KINT Rewards & APY
  const monetaryLockingAmount = newMonetaryAmount(lockingAmount, GOVERNANCE_TOKEN, true);
  const {
    isIdle: estimatedRewardAmountAndAPYIdle,
    isLoading: estimatedRewardAmountAndAPYLoading,
    data: estimatedRewardAmountAndAPY,
    error: estimatedRewardAmountAndAPYError
  } = useQuery<RewardAmountAndAPY, Error>(
    [
      GENERIC_FETCHER,
      'interBtcApi',
      'escrow',
      'getRewardEstimate',
      address,
      monetaryLockingAmount
    ],
    genericFetcher<RewardAmountAndAPY>(),
    {
      enabled: !!bridgeLoaded
    }
  );
  useErrorHandler(estimatedRewardAmountAndAPYError);

  const {
    isIdle: stakedAmountAndEndBlockIdle,
    isLoading: stakedAmountAndEndBlockLoading,
    data: stakedAmountAndEndBlock,
    error: stakedAmountAndEndBlockError
  } = useQuery<StakedAmountAndEndBlock, Error>(
    [
      GENERIC_FETCHER,
      'interBtcApi',
      'escrow',
      'getStakedBalance',
      address
    ],
    genericFetcher<StakedAmountAndEndBlock>(),
    {
      enabled: !!bridgeLoaded
    }
  );
  useErrorHandler(stakedAmountAndEndBlockError);

  const initialStakeMutation = useMutation<void, Error, LockingAmountAndTime>(
    (variables: LockingAmountAndTime) => {
      if (currentBlockNumber === undefined) {
        throw new Error('Something went wrong!');
      }
      const unlockHeight = currentBlockNumber + getLockBlocks(variables.time);

      return window.bridge.interBtcApi.escrow.createLock(variables.amount, unlockHeight);
    },
    {
      onSuccess: (_, variables) => {
        voteGovernanceTokenBalanceRefetch();
        console.log('[initialStakeMutation onSuccess] variables => ', variables);
        reset({
          [LOCKING_AMOUNT]: '0.0',
          [LOCK_TIME]: '0'
        });
      },
      onError: error => {
        // TODO: should add error handling UX
        console.log('[initialStakeMutation onError] error => ', error);
      }
    }
  );

  const moreStakeMutation = useMutation<void, Error, LockingAmountAndTime>(
    (variables: LockingAmountAndTime) => {
      return (async () => {
        if (currentBlockNumber === undefined) {
          throw new Error('Something went wrong!');
        }
        if ( // Increase amount and extend lock time
          variables.time > 0 &&
          variables.amount.gt(ZERO_GOVERNANCE_TOKEN_AMOUNT)
        ) {
          const unlockHeight = currentBlockNumber + getLockBlocks(variables.time);

          const txs = [
            window.bridge.interBtcApi.api.tx.escrow.increaseAmount(
              variables.amount.toString(variables.amount.currency.rawBase)
            ),
            window.bridge.interBtcApi.api.tx.escrow.increaseUnlockHeight(unlockHeight)
          ];
          const batch = window.bridge.interBtcApi.api.tx.utility.batchAll(txs);
          await DefaultTransactionAPI.sendLogged(
            window.bridge.interBtcApi.api,
            window.bridge.interBtcApi.account as AddressOrPair,
            batch
          );
        } else if ( // Only increase amount
          variables.time === 0 &&
          variables.amount.gt(ZERO_GOVERNANCE_TOKEN_AMOUNT)
        ) {
          return await window.bridge.interBtcApi.escrow.increaseAmount(variables.amount);
        } else if ( // Only extend lock time
          variables.time > 0 &&
          variables.amount.eq(ZERO_GOVERNANCE_TOKEN_AMOUNT)
        ) {
          const unlockHeight = currentBlockNumber + getLockBlocks(variables.time);

          return await window.bridge.interBtcApi.escrow.increaseUnlockHeight(unlockHeight);
        } else {
          throw new Error('Something went wrong!');
        }
      })();
    },
    {
      onSuccess: (_, variables) => {
        voteGovernanceTokenBalanceRefetch();
        console.log('[moreStakeMutation onSuccess] variables => ', variables);
        reset({
          [LOCKING_AMOUNT]: '0.0',
          [LOCK_TIME]: '0'
        });
      },
      onError: error => {
        // TODO: should add error handling UX
        console.log('[moreStakeMutation onError] error => ', error);
      }
    }
  );

  React.useEffect(() => {
    reset({
      [LOCKING_AMOUNT]: '',
      [LOCK_TIME]: ''
    });
  }, [
    address,
    reset
  ]);

  const votingBalanceGreaterThanZero = voteGovernanceTokenBalance?.gt(ZERO_VOTE_GOVERNANCE_TOKEN_AMOUNT);

  const extendLockTimeSet = votingBalanceGreaterThanZero && parseInt(lockTime) > 0;

  React.useEffect(() => {
    if (extendLockTimeSet) {
      trigger(LOCKING_AMOUNT);
    }
  }, [
    lockTime,
    extendLockTimeSet,
    trigger
  ]);

  const onSubmit = (data: StakingFormData) => {
    if (!bridgeLoaded) return;
    if (currentBlockNumber === undefined) {
      throw new Error('Something went wrong!');
    }

    const lockingAmountWithFallback = data[LOCKING_AMOUNT] || '0';
    const lockTimeWithFallback = data[LOCK_TIME] || '0'; // Weeks

    const monetaryAmount = newMonetaryAmount(lockingAmountWithFallback, GOVERNANCE_TOKEN, true);
    const numberTime = parseInt(lockTimeWithFallback);

    if (votingBalanceGreaterThanZero) {
      moreStakeMutation.mutate({
        amount: monetaryAmount,
        time: numberTime
      });
    } else {
      initialStakeMutation.mutate({
        amount: monetaryAmount,
        time: numberTime
      });
    }
  };

  const validateLockingAmount = (value: string): string | undefined => {
    const valueWithFallback = value || '0';
    const monetaryLockingAmount = newMonetaryAmount(valueWithFallback, GOVERNANCE_TOKEN, true);

    if (
      !extendLockTimeSet &&
      monetaryLockingAmount.lte(ZERO_GOVERNANCE_TOKEN_AMOUNT)
    ) {
      return 'Locking amount must be greater than zero!';
    }

    if (monetaryLockingAmount.gt(governanceTokenBalance)) {
      return 'Locking amount must be less than governance token balance!';
    }

    const planckLockingAmount = monetaryLockingAmount.to.Planck();
    const lockBlocks = getLockBlocks(parseInt(lockTime));
    // This is related to the on-chain implementation where currency values are integers.
    // So less tokens than the period would likely round to 0.
    // So on the UI, as long as you require more planck to be locked than the number of blocks the user locks for,
    // it should be good.
    if (
      !extendLockTimeSet &&
      planckLockingAmount.lte(Big(lockBlocks))
    ) {
      return 'Planck to be locked must be greater than the number of blocks you lock for!';
    }

    return undefined;
  };

  const validateLockTime = (value: string): string | undefined => {
    const valueWithFallback = value || '0';
    const numericValue = parseInt(valueWithFallback);

    if (votingBalanceGreaterThanZero && numericValue === 0) {
      return undefined;
    }

    if (
      numericValue < STAKE_LOCK_TIME.MIN ||
      numericValue > STAKE_LOCK_TIME.MAX
    ) {
      return `Please enter a number between ${STAKE_LOCK_TIME.MIN}-${STAKE_LOCK_TIME.MAX}.`;
    }

    return undefined;
  };

  const renderVoteStakedAmountLabel = () => {
    if (
      voteGovernanceTokenBalanceIdle ||
      voteGovernanceTokenBalanceLoading
    ) {
      return '-';
    }
    if (voteGovernanceTokenBalance === undefined) {
      throw new Error('Something went wrong!');
    }

    return displayMonetaryAmount(voteGovernanceTokenBalance);
  };

  const renderRewardAmountLabel = () => {
    if (
      rewardAmountAndAPYIdle ||
      rewardAmountAndAPYLoading
    ) {
      return '-';
    }
    if (rewardAmountAndAPY === undefined) {
      throw new Error('Something went wrong!');
    }

    return displayMonetaryAmount(rewardAmountAndAPY.amount);
  };

  const renderStakedAmountLabel = () => {
    if (stakedAmount === undefined) {
      return '-';
    }

    return displayMonetaryAmount(stakedAmount);
  };

  const getRemainingBlockNumbersToUnstake = () => {
    if (
      stakedAmountAndEndBlockIdle ||
      stakedAmountAndEndBlockLoading ||
      currentBlockNumberIdle ||
      currentBlockNumberLoading
    ) {
      return undefined;
    }
    if (stakedAmountAndEndBlock === undefined) {
      throw new Error('Something went wrong!');
    }
    if (currentBlockNumber === undefined) {
      throw new Error('Something went wrong!');
    }

    return stakedAmountAndEndBlock.endBlock - currentBlockNumber;
  };
  const remainingBlockNumbersToUnstake = getRemainingBlockNumbersToUnstake();

  const getStakedAmount = () => {
    if (
      stakedAmountAndEndBlockIdle ||
      stakedAmountAndEndBlockLoading
    ) {
      return undefined;
    }
    if (stakedAmountAndEndBlock === undefined) {
      throw new Error('Something went wrong!');
    }

    return stakedAmountAndEndBlock.amount;
  };
  const stakedAmount = getStakedAmount();

  const availableBalanceLabel = displayMonetaryAmount(governanceTokenTransferableBalance);

  const renderUnlockDateLabel = () => {
    const numericLockTime = parseInt(lockTime);
    if (
      numericLockTime < STAKE_LOCK_TIME.MIN ||
      numericLockTime > STAKE_LOCK_TIME.MAX
    ) {
      return '-';
    }

    const unlockDate = add(new Date(), {
      weeks: numericLockTime
    });

    return format(unlockDate, YEAR_MONTH_DAY_PATTERN);
  };

  const renderNewUnlockDateLabel = () => {
    if (remainingBlockNumbersToUnstake === undefined) {
      return '-';
    }

    const numericLockTime = parseInt(lockTime);
    if (
      numericLockTime < STAKE_LOCK_TIME.MIN ||
      numericLockTime > STAKE_LOCK_TIME.MAX
    ) {
      return '-';
    }

    const unlockDate = add(new Date(), {
      weeks: numericLockTime,
      seconds: (remainingBlockNumbersToUnstake > 0 ? remainingBlockNumbersToUnstake : 0) * BLOCK_TIME
    });

    return format(unlockDate, YEAR_MONTH_DAY_PATTERN);
  };

  const renderNewTotalStakeLabel = () => {
    if (
      voteGovernanceTokenBalanceIdle ||
      voteGovernanceTokenBalanceLoading
    ) {
      return '-';
    }
    if (voteGovernanceTokenBalance === undefined) {
      throw new Error('Something went wrong!');
    }

    return displayMonetaryAmount(monetaryLockingAmount.add(voteGovernanceTokenBalance));
  };

  const renderEstimatedAPYLabel = () => {
    if (
      estimatedRewardAmountAndAPYIdle ||
      estimatedRewardAmountAndAPYLoading
    ) {
      return '-';
    }
    if (estimatedRewardAmountAndAPY === undefined) {
      throw new Error('Something went wrong!');
    }

    return estimatedRewardAmountAndAPY.apy;
  };

  const renderEstimatedRewardAmountLabel = () => {
    if (
      estimatedRewardAmountAndAPYIdle ||
      estimatedRewardAmountAndAPYLoading
    ) {
      return '-';
    }
    if (estimatedRewardAmountAndAPY === undefined) {
      throw new Error('Something went wrong!');
    }

    return displayMonetaryAmount(estimatedRewardAmountAndAPY.amount);
  };

  const handleConfirmClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // TODO: should be handled based on https://kentcdodds.com/blog/application-state-management-with-react
    if (!accountSet) {
      dispatch(showAccountModalAction(true));
      event.preventDefault();
    }
  };

  const valueInUSDOfLockingAmount = getUsdAmount(monetaryLockingAmount, prices.governanceToken.usd);

  const claimRewardsButtonAvailable = rewardAmountAndAPY?.amount.gt(ZERO_GOVERNANCE_TOKEN_AMOUNT);

  const unlockFirst =
    stakedAmount?.gt(ZERO_GOVERNANCE_TOKEN_AMOUNT) &&
    remainingBlockNumbersToUnstake !== undefined &&
    remainingBlockNumbersToUnstake <= 0;

  const accountSet = !!address;

  const initializing =
    currentBlockNumberIdle ||
    currentBlockNumberLoading ||
    voteGovernanceTokenBalanceIdle ||
    voteGovernanceTokenBalanceLoading ||
    rewardAmountAndAPYIdle ||
    rewardAmountAndAPYLoading ||
    estimatedRewardAmountAndAPYIdle ||
    estimatedRewardAmountAndAPYLoading ||
    stakedAmountAndEndBlockIdle ||
    stakedAmountAndEndBlockLoading;

  let submitButtonLabel: string;
  if (initializing) {
    submitButtonLabel = 'Loading...';
  } else {
    if (accountSet) {
      submitButtonLabel = votingBalanceGreaterThanZero ? 'Add more stake' : 'Stake';
    } else {
      submitButtonLabel = t('connect_wallet');
    }
  }

  return (
    <>
      <MainContainer>
        <Panel
          className={clsx(
            'mx-auto',
            'w-full',
            'md:max-w-xl'
          )}>
          <form
            className={clsx(
              'p-8',
              'space-y-8'
            )}
            onSubmit={handleSubmit(onSubmit)}>
            <Title />
            <BalancesUI
              stakedAmount={renderStakedAmountLabel()}
              voteStakedAmount={renderVoteStakedAmountLabel()}
              rewardAmount={renderRewardAmountLabel()} />
            {claimRewardsButtonAvailable && (
              <ClaimRewardsButton />
            )}
            {stakedAmount?.gt(ZERO_GOVERNANCE_TOKEN_AMOUNT) && (
              <WithdrawButton
                stakedAmount={renderStakedAmountLabel()}
                remainingBlockNumbersToUnstake={remainingBlockNumbersToUnstake} />
            )}
            <div className='space-y-2'>
              <AvailableBalanceUI balance={availableBalanceLabel} />
              <TokenField
                id={LOCKING_AMOUNT}
                name={LOCKING_AMOUNT}
                label={GOVERNANCE_TOKEN_SYMBOL}
                min={0}
                ref={register({
                  required: {
                    value: extendLockTimeSet ? false : true,
                    message: 'This field is required!'
                  },
                  validate: value => validateLockingAmount(value)
                })}
                approxUSD={`≈ $ ${valueInUSDOfLockingAmount}`}
                error={!!errors[LOCKING_AMOUNT]}
                helperText={errors[LOCKING_AMOUNT]?.message} />
            </div>
            <LockTimeField
              id={LOCK_TIME}
              name={LOCK_TIME}
              min={0}
              ref={register({
                required: {
                  value: votingBalanceGreaterThanZero ? false : true,
                  message: 'This field is required!'
                },
                validate: value => validateLockTime(value)
              })}
              error={!!errors[LOCK_TIME]}
              helperText={errors[LOCK_TIME]?.message}
              optional={votingBalanceGreaterThanZero}
              disabled={votingBalanceGreaterThanZero === undefined} />
            {votingBalanceGreaterThanZero ? (
              <InformationUI
                label='New unlock Date'
                value={renderNewUnlockDateLabel()}
                tooltip='Your original lock date plus the extended lock time.' />
            ) : (
              <InformationUI
                label='Unlock Date'
                value={renderUnlockDateLabel()}
                tooltip='Your staked amount will be locked until this date.' />
            )}
            {votingBalanceGreaterThanZero && (
              <InformationUI
                label='New total Stake'
                value={`${renderNewTotalStakeLabel()} ${VOTE_GOVERNANCE_TOKEN_SYMBOL}`}
                tooltip='Your total stake after this transaction.' />
            )}
            <InformationUI
              label='Estimated APY'
              value={renderEstimatedAPYLabel()}
              tooltip={`The APY may change as the amount of total ${VOTE_GOVERNANCE_TOKEN_SYMBOL} changes`} />
            <InformationUI
              label={`Estimated ${GOVERNANCE_TOKEN_SYMBOL} Rewards`}
              value={`${renderEstimatedRewardAmountLabel()}  ${GOVERNANCE_TOKEN_SYMBOL}`}
              // eslint-disable-next-line max-len
              tooltip={`The estimated amount of KINT you will receive as rewards. Depends on your proportion of the total ${VOTE_GOVERNANCE_TOKEN_SYMBOL}.`} />
            <SubmitButton
              disabled={
                initializing ||
                unlockFirst
              }
              pending={
                initialStakeMutation.isLoading ||
                moreStakeMutation.isLoading
              }
              onClick={handleConfirmClick}
              endIcon={
                unlockFirst ? (
                  <InterlayTooltip
                    label='Please unstake first.'>
                    <InformationCircleIcon
                      onClick={event => {
                        event.stopPropagation();
                      }}
                      className={clsx(
                        'pointer-events-auto',
                        'w-5',
                        'h-5'
                      )} />
                  </InterlayTooltip>
                ) : null
              }>
              {submitButtonLabel}
            </SubmitButton>
          </form>
        </Panel>
      </MainContainer>
      {(
        initialStakeMutation.isError ||
        moreStakeMutation.isError
      ) && (
        <ErrorModal
          open={
            initialStakeMutation.isError ||
            moreStakeMutation.isError
          }
          onClose={() => {
            initialStakeMutation.reset();
            moreStakeMutation.reset();
          }}
          title='Error'
          description={
            initialStakeMutation.error?.message ||
            moreStakeMutation.error?.message ||
            ''
          } />
      )}
    </>
  );
};

export default withErrorBoundary(Staking, {
  FallbackComponent: ErrorFallback,
  onReset: () => {
    window.location.reload();
  }
});
