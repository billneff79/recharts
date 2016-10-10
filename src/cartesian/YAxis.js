/**
 * @fileOverview Y Axis
 */
import { PropTypes } from 'react';
import CartesianAxis from './CartesianAxis';

class YAxis extends CartesianAxis {

  static displayName = 'YAxis';

  static propTypes = {
    ...CartesianAxis.propTypes,
    // The unique id of y-axis
    yAxisId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    // The orientation of axis
    orientation: PropTypes.oneOf(['left', 'right']),
  };

  static defaultProps = {
    ...CartesianAxis.defaultProps,
    orientation: 'left',
    yAxisId: 0,
    width: 60,
    height: 0,
    type: 'number',
    domain: [0, 'auto'],
    padding: { top: 0, bottom: 0 },
  };

}

export default YAxis;
