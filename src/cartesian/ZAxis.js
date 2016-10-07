/**
 * @fileOverview Z Axis
 */
import { PropTypes } from 'react';
import CartesianAxis from './CartesianAxis';

class ZAxis extends CartesianAxis {

  static displayName = 'ZAxis';

  static propTypes = {
    ...CartesianAxis.propTypes,
    // The unique id of z-axis
    zAxisId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    // The range of axis
    range: PropTypes.arrayOf(PropTypes.number),
  };

  static defaultProps = {
    ...CartesianAxis.defaultProps,
    zAxisId: 0,
    range: [64, 64],
  };

}

export default ZAxis;
