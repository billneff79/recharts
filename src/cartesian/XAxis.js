/**
 * @fileOverview X Axis
 */
import { PropTypes } from 'react';
import CartesianAxis from './CartesianAxis';

class XAxis extends CartesianAxis {

  static displayName = 'XAxis';

  static propTypes = {
    ...CartesianAxis.propTypes,
    xAxisId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    // The orientation of axis
    orientation: PropTypes.oneOf(['top', 'bottom']),
  };

  static defaultProps = {
    ...CartesianAxis.defaultProps,
    xAxisId: 0,
    orientation: 'bottom',
    allowDecimals: true,
    width: 0,
    height: 30,
    tickCount: 5,
    type: 'category',
    domain: [0, 'auto'],
    padding: { left: 0, right: 0 },
    allowDataOverflow: false,
  };

}

export default XAxis;
