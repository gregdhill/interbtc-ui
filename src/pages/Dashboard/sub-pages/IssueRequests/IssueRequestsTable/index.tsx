// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import * as React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTable } from 'react-table';
import { useQuery } from 'react-query';
import clsx from 'clsx';
import {
  useErrorHandler,
  withErrorBoundary
} from 'react-error-boundary';
import { BitcoinNetwork } from '@interlay/interbtc-index-client';
import {
  Issue,
  IssueStatus
} from '@interlay/interbtc-api';

import SectionTitle from 'parts/SectionTitle';
import PrimaryColorEllipsisLoader from 'components/PrimaryColorEllipsisLoader';
import ErrorFallback from 'components/ErrorFallback';
import ExternalLink from 'components/ExternalLink';
import InterlayPagination from 'components/UI/InterlayPagination';
import InterlayTable, {
  InterlayTableContainer,
  InterlayThead,
  InterlayTbody,
  InterlayTr,
  InterlayTh,
  InterlayTd
} from 'components/UI/InterlayTable';
import StatusCell from 'components/UI/InterlayTable/StatusCell';
import { BTC_ADDRESS_API } from 'config/bitcoin';
import { WrappedTokenAmount } from 'config/relay-chains';
import useQueryParams from 'utils/hooks/use-query-params';
import useUpdateQueryParameters from 'utils/hooks/use-update-query-parameters';
import {
  shortAddress,
  formatDateTimePrecise
} from 'common/utils/utils';
import { QUERY_PARAMETERS } from 'utils/constants/links';
import { TABLE_PAGE_LIMIT } from 'utils/constants/general';
import STATUSES from 'utils/constants/statuses';
import * as constants from '../../../../../constants';
import genericFetcher, {
  GENERIC_FETCHER
} from 'services/fetchers/generic-fetcher';
import { StoreType } from 'common/types/util.types';

const IssueRequestsTable = (): JSX.Element => {
  const queryParams = useQueryParams();
  const { bridgeLoaded } = useSelector((state: StoreType) => state.general);
  const selectedPage = Number(queryParams.get(QUERY_PARAMETERS.PAGE)) || 1;
  const updateQueryParameters = useUpdateQueryParameters();
  const [data, setData] = React.useState<Issue[]>([]);
  const [status, setStatus] = React.useState(STATUSES.IDLE);
  const handleError = useErrorHandler();
  const { t } = useTranslation();

  React.useEffect(() => {
    if (!selectedPage) return;
    if (!handleError) return;
    if (!bridgeLoaded) return;

    const selectedPageIndex = selectedPage - 1;

    try {
      (async () => {
        setStatus(STATUSES.PENDING);
        const response = await window.bridge.interBtcIndex.getIssues({
          page: selectedPageIndex,
          perPage: TABLE_PAGE_LIMIT,
          network: constants.BITCOIN_NETWORK as BitcoinNetwork
        });
        setStatus(STATUSES.RESOLVED);
        setData(response);
      })();
    } catch (error) {
      setStatus(STATUSES.REJECTED);
      handleError(error);
    }
  }, [
    bridgeLoaded,
    selectedPage,
    handleError
  ]);

  const columns = React.useMemo(
    () => [
      {
        Header: t('date'),
        accessor: 'creationTimestamp',
        classNames: [
          'text-left'
        ],
        Cell: function FormattedCell({ value }: { value: number; }) {
          return (
            <>
              {formatDateTimePrecise(new Date(Number(value)))}
            </>
          );
        }
      },
      {
        Header: t('issue_page.amount'),
        accessor: 'wrappedAmount',
        classNames: [
          'text-right'
        ],
        Cell: function FormattedCell({ value }: {
          value: WrappedTokenAmount;
        }) {
          return (
            <>
              {value.toHuman()}
            </>
          );
        }
      },
      {
        Header: t('issue_page.parachain_block'),
        accessor: 'creationBlock',
        classNames: [
          'text-right'
        ]
      },
      {
        Header: t('issue_page.vault_dot_address'),
        accessor: 'vaultId',
        classNames: [
          'text-left'
        ],
        Cell: function FormattedCell({ value }: { value: string; }) {
          return (
            <>
              {shortAddress(value.accountId.toString())}
            </>
          );
        }
      },
      {
        Header: t('issue_page.vault_btc_address'),
        accessor: 'vaultWrappedAddress',
        classNames: [
          'text-left'
        ],
        Cell: function FormattedCell({ value }: { value: string; }) {
          return (
            <ExternalLink href={`${BTC_ADDRESS_API}${value}`}>
              {shortAddress(value)}
            </ExternalLink>
          );
        }
      },
      {
        Header: t('status'),
        accessor: 'status',
        classNames: [
          'text-left'
        ],
        Cell: function FormattedCell({ value }: { value: IssueStatus; }) {
          return (
            <StatusCell
              status={{
                completed: value === IssueStatus.Completed,
                cancelled: value === IssueStatus.Cancelled,
                isExpired: value === IssueStatus.Expired,
                reimbursed: false
              }} />
          );
        }
      }
    ],
    [t]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable(
    {
      columns,
      data
    }
  );

  const {
    isIdle: totalIssueRequestsIdle,
    isLoading: totalIssueRequestsLoading,
    data: totalIssueRequests,
    error: totalIssueRequestsError
  } = useQuery<number, Error>(
    [
      GENERIC_FETCHER,
      'interBtcIndex',
      'getTotalIssues'
    ],
    genericFetcher<number>(),
    {
      enabled: !!bridgeLoaded
    }
  );
  useErrorHandler(totalIssueRequestsError);

  const renderContent = () => {
    if (
      (status === STATUSES.IDLE || status === STATUSES.PENDING) ||
      (totalIssueRequestsIdle || totalIssueRequestsLoading)
    ) {
      return <PrimaryColorEllipsisLoader />;
    }
    if (totalIssueRequests === undefined) {
      throw new Error('Something went wrong!');
    }

    if (status === STATUSES.RESOLVED) {
      const handlePageChange = ({ selected: newSelectedPageIndex }: { selected: number; }) => {
        updateQueryParameters({
          [QUERY_PARAMETERS.PAGE]: (newSelectedPageIndex + 1).toString()
        });
      };

      const selectedPageIndex = selectedPage - 1;
      const pageCount = Math.ceil(totalIssueRequests / TABLE_PAGE_LIMIT);

      return (
        <>
          <InterlayTable {...getTableProps()}>
            <InterlayThead>
              {headerGroups.map(headerGroup => (
                // eslint-disable-next-line react/jsx-key
                <InterlayTr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    // eslint-disable-next-line react/jsx-key
                    <InterlayTh
                      {...column.getHeaderProps([
                        {
                          className: clsx(column.classNames),
                          style: column.style
                        }
                      ])}>
                      {column.render('Header')}
                    </InterlayTh>
                  ))}
                </InterlayTr>
              ))}
            </InterlayThead>
            <InterlayTbody {...getTableBodyProps()}>
              {rows.map(row => {
                prepareRow(row);

                return (
                  // eslint-disable-next-line react/jsx-key
                  <InterlayTr {...row.getRowProps()}>
                    {row.cells.map(cell => {
                      return (
                        // eslint-disable-next-line react/jsx-key
                        <InterlayTd
                          {...cell.getCellProps([
                            {
                              className: clsx(cell.column.classNames),
                              style: cell.column.style
                            }
                          ])}>
                          {cell.render('Cell')}
                        </InterlayTd>
                      );
                    })}
                  </InterlayTr>
                );
              })}
            </InterlayTbody>
          </InterlayTable>
          {pageCount > 0 && (
            <div
              className={clsx(
                'flex',
                'justify-end'
              )}>
              <InterlayPagination
                pageCount={pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageChange}
                forcePage={selectedPageIndex} />
            </div>
          )}
        </>
      );
    }

    throw new Error('Something went wrong!');
  };

  return (
    <InterlayTableContainer className='space-y-6'>
      <SectionTitle>
        {t('issue_page.recent_requests')}
      </SectionTitle>
      {renderContent()}
    </InterlayTableContainer>
  );
};

export default withErrorBoundary(IssueRequestsTable, {
  FallbackComponent: ErrorFallback,
  onReset: () => {
    window.location.reload();
  }
});
