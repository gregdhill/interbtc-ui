import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import {
  useErrorHandler,
  withErrorBoundary
} from 'react-error-boundary';
import { CollateralTimeData } from '@interlay/interbtc-index-client';
import { newMonetaryAmount } from '@interlay/interbtc-api';

import LineChart from '../../LineChart';
import DashboardCard from '../DashboardCard';
import Stats, {
  StatsDt,
  StatsDd,
  StatsRouterLink
} from '../../Stats';
import ErrorFallback from 'components/ErrorFallback';
import {
  COLLATERAL_TOKEN_SYMBOL,
  COLLATERAL_TOKEN
} from 'config/relay-chains';
import {
  POLKADOT,
  KUSAMA
} from 'utils/constants/relay-chain-names';
import {
  INTERLAY_DENIM,
  KINTSUGI_SUPERNOVA
} from 'utils/constants/colors';
import { PAGES } from 'utils/constants/links';
import {
  getUsdAmount,
  displayMonetaryAmount
} from 'common/utils/utils';
import genericFetcher, {
  GENERIC_FETCHER
} from 'services/fetchers/generic-fetcher';
import { StoreType } from 'common/types/util.types';

interface Props {
  hasLinks?: boolean;
}

const CollateralLockedCard = ({ hasLinks }: Props): JSX.Element => {
  const {
    prices,
    bridgeLoaded
  } = useSelector((state: StoreType) => state.general);
  const { t } = useTranslation();

  const {
    isIdle: cumulativeCollateralPerDayIdle,
    isLoading: cumulativeCollateralPerDayLoading,
    data: cumulativeCollateralPerDay,
    error: cumulativeCollateralPerDayError
  } = useQuery<Array<CollateralTimeData>, Error>(
    [
      GENERIC_FETCHER,
      'interBtcIndex',
      'getRecentDailyCollateralLocked',
      { daysBack: 6 }
    ],
    genericFetcher<Array<CollateralTimeData>>(),
    {
      enabled: !!bridgeLoaded
    }
  );
  useErrorHandler(cumulativeCollateralPerDayError);

  const renderContent = () => {
    // TODO: should use skeleton loaders
    if (cumulativeCollateralPerDayIdle || cumulativeCollateralPerDayLoading) {
      return <>Loading...</>;
    }
    if (cumulativeCollateralPerDay === undefined) {
      throw new Error('Something went wrong!');
    }
    const totalLockedCollateralTokenAmount = newMonetaryAmount(
      cumulativeCollateralPerDay.slice(-1)[0].amount,
      COLLATERAL_TOKEN
    );

    let chartLineColor;
    if (process.env.REACT_APP_RELAY_CHAIN_NAME === POLKADOT) {
      chartLineColor = INTERLAY_DENIM[500];
    // MEMO: should check dark mode as well
    } else if (process.env.REACT_APP_RELAY_CHAIN_NAME === KUSAMA) {
      chartLineColor = KINTSUGI_SUPERNOVA[500];
    } else {
      throw new Error('Something went wrong!');
    }

    return (
      <>
        <Stats
          leftPart={
            <>
              <StatsDt>
                {t('dashboard.vault.locked_collateral')}
              </StatsDt>
              <StatsDd>
                {displayMonetaryAmount(totalLockedCollateralTokenAmount)} {COLLATERAL_TOKEN_SYMBOL}
              </StatsDd>
              <StatsDd>
                ${getUsdAmount(totalLockedCollateralTokenAmount, prices.collateralToken.usd)}
              </StatsDd>
            </>
          }
          rightPart={
            <>
              {hasLinks && (
                <StatsRouterLink to={PAGES.DASHBOARD_VAULTS}>
                  View vaults
                </StatsRouterLink>
              )}
            </>
          } />
        <LineChart
          wrapperClassName='h-full'
          colors={[chartLineColor]}
          labels={[t('dashboard.vault.total_collateral_locked')]}
          yLabels={cumulativeCollateralPerDay
            .slice(1)
            .map(dataPoint => new Date(dataPoint.date).toISOString().substring(0, 10))}
          yAxes={[
            {
              ticks: {
                beginAtZero: true,
                precision: 0
              }
            }
          ]}
          datasets={[
            cumulativeCollateralPerDay.slice(1).map(
              dataPoint => displayMonetaryAmount(newMonetaryAmount(dataPoint.amount, COLLATERAL_TOKEN))
            )
          ]} />
      </>
    );
  };

  return (
    <DashboardCard>
      {renderContent()}
    </DashboardCard>
  );
};

export default withErrorBoundary(CollateralLockedCard, {
  FallbackComponent: ErrorFallback,
  onReset: () => {
    window.location.reload();
  }
});
