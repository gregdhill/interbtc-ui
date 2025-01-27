
import * as React from 'react';
import clsx from 'clsx';

import IconButton, { Props as IconButtonProps } from 'components/buttons/IconButton';
import {
  POLKADOT,
  KUSAMA
} from 'utils/constants/relay-chain-names';
import { ReactComponent as CloseIcon } from 'assets/img/icons/close.svg';

type Ref = HTMLButtonElement;
const CloseIconButton = React.forwardRef<Ref, IconButtonProps>(({
  className,
  ...rest
}, ref) => (
  <IconButton
    ref={ref}
    className={clsx(
      'w-12',
      'h-12',
      'absolute',
      'top-3',
      'right-3',
      className
    )}
    {...rest}>
    <CloseIcon
      width={18}
      height={18}
      className={clsx(
        { 'text-interlayTextSecondaryInLightMode':
          process.env.REACT_APP_RELAY_CHAIN_NAME === POLKADOT },
        { 'dark:text-kintsugiTextSecondaryInDarkMode': process.env.REACT_APP_RELAY_CHAIN_NAME === KUSAMA }
      )} />
  </IconButton>
));
CloseIconButton.displayName = 'CloseIconButton';

export default CloseIconButton;
