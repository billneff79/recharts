import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { scaleLinear, scaleBand, scalePoint } from 'd3-scale';
import classNames from 'classnames';
import Surface from '../container/Surface';
import Layer from '../container/Layer';
import Tooltip from '../component/Tooltip';
import Legend from '../component/Legend';

import { warn } from '../util/LogUtils';
import { findAllByType, findChildByType, filterSvgElements, getDisplayName,
  getPresentationAttributes, validateWidthHeight } from '../util/ReactUtils';
import _ from 'lodash';

import CartesianAxis from '../cartesian/CartesianAxis';
import CartesianGrid from '../cartesian/CartesianGrid';
import ReferenceLine from '../cartesian/ReferenceLine';
import ReferenceDot from '../cartesian/ReferenceDot';
import ReferenceArea from '../cartesian/ReferenceArea';
import XAxis from '../cartesian/XAxis';
import YAxis from '../cartesian/YAxis';
import Brush from '../cartesian/Brush';
import { getOffset, calculateChartCoordinate } from '../util/DOMUtils';
import { parseSpecifiedDomain, getAnyElementOfObject, hasDuplicate } from '../util/DataUtils';
import { calculateActiveTickIndex,
  detectReferenceElementsDomain, getMainColorOfGraphicItem, getDomainOfStackGroups,
  getDomainOfDataByKey, getLegendProps, getDomainOfItemsWithSameAxis, getCoordinatesOfGrid,
  getStackGroupsByAxisId, getTicksOfAxis, isCategorialAxis, getTicksOfScale,
} from '../util/CartesianUtils';
import { eventCenter, SYNC_EVENT } from '../util/Events';

const ORIENT_MAP = {
  xAxis: ['bottom', 'top'],
  yAxis: ['left', 'right'],
};

const originCoordinate = { x: 0, y: 0 };

const generateCategoricalChart = (ChartComponent, GraphicalChild) => {
  class CategoricalChartWrapper extends Component {
    static displayName = getDisplayName(ChartComponent);

    static propTypes = {
      syncId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      width: PropTypes.number,
      height: PropTypes.number,
      data: PropTypes.arrayOf(PropTypes.object),
      startIndex: PropTypes.number,
      endIndex: PropTypes.number,
      layout: PropTypes.oneOf(['horizontal', 'vertical']),
      stackOffset: PropTypes.oneOf(['sign', 'expand', 'none', 'wiggle', 'silhouette']),
      margin: PropTypes.shape({
        top: PropTypes.number,
        right: PropTypes.number,
        bottom: PropTypes.number,
        left: PropTypes.number,
      }),
      style: PropTypes.object,
      className: PropTypes.string,
      children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
      ]),
    };

    static defaultProps = {
      layout: 'horizontal',
      stackOffset: 'none',
      margin: { top: 5, right: 5, bottom: 5, left: 5 },
    };


    constructor(props) {
      super(props);
      this.state = this.createDefaultState(props);
      this.validateAxes();
      this.uniqueChartId = _.uniqueId('recharts');
    }

    componentWillMount() {
			// set the startIndex and endIndex state appropriately
			// handleBrushChange also calls updateStateOfAxisMapsOffsetAndStackGroups
			// so only call that if handleBrush change didn't need to make a change
      if (!this.handleBrushChangeForThis(this.props)) {
        this.setState(
						this.updateStateOfAxisMapsOffsetAndStackGroups({ props: this.props, ...this.state }));
      }
    }

    componentDidMount() {
      if (!_.isNil(this.props.syncId)) {
        this.addListener();
      }
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.data !== this.props.data) {
        const defaultState = this.createDefaultState(nextProps);
        this.setState({ ...defaultState,
					...this.updateStateOfAxisMapsOffsetAndStackGroups(
						{ props: this.props, ...defaultState }) }
				);
      }
      // add syncId
      if (_.isNil(this.props.syncId) && !_.isNil(nextProps.syncId)) {
        this.addListener();
      }
      // remove syncId
      if (!_.isNil(this.props.syncId) && _.isNil(nextProps.syncId)) {
        this.removeListener();
      }

			// this will be a no-op if the startIndex/endIndex are not defined or are the
			// same as the defaults, otherwise it sync's the other graphs appropriately
      this.handleBrushChange(nextProps);
    }

    componentWillUnmount() {
      if (!_.isNil(this.props.syncId)) {
        this.removeListener();
      }
    }

    /**
   * Get the configuration of all x-axis or y-axis
   * @param  {String} axisType    The type of axis
   * @param  {Array} items        The instances of item
   * @param  {Object} stackGroups The items grouped by axisId and stackId
	 * @param {Number} dataStartIndex The start index of the data series when a brush is applied
	 * @param {Number} dataEndIndex The end index of the data series when a brush is applied
   * @return {Object}          Configuration
   */
    getAxisMap({ axisType = 'xAxis', items, stackGroups, dataStartIndex, dataEndIndex }) {


      const { children } = this.props;
      const Axis = axisType === 'xAxis' ? XAxis : YAxis;
      const axisIdKey = axisType === 'xAxis' ? 'xAxisId' : 'yAxisId';
      // Get all the instance of Axis
      const axes = findAllByType(children, Axis);

      let axisMap = {};

      if (axes && axes.length) {
        axisMap = this.getAxisMapByAxes({ axes, items, axisType, axisIdKey,
					stackGroups, dataStartIndex, dataEndIndex });
      } else if (items && items.length) {
        axisMap = this.getAxisMapByItems({ items, Axis, axisType, axisIdKey,
					stackGroups, dataStartIndex, dataEndIndex });
      }

      return axisMap;
    }

    /**
     * Get the configuration of axis by the options of axis instance
     * @param {Array}  axes  The instance of axes
     * @param  {Array} items The instances of item
     * @param  {String} axisType The type of axis, xAxis - x-axis, yAxis - y-axis
     * @param  {String} axisIdKey The unique id of an axis
     * @param  {Object} stackGroups The items grouped by axisId and stackId
		 * @param {Number} dataStartIndex The start index of the data series when a brush is applied
		 * @param {Number} dataEndIndex The end index of the data series when a brush is applied
     * @return {Object}      Configuration
     */
    getAxisMapByAxes({ axes, items, axisType, axisIdKey,
			stackGroups, dataStartIndex, dataEndIndex }) {

      const { layout, children, data } = this.props;
      const displayedData = data.slice(dataStartIndex, dataEndIndex + 1);
      const len = displayedData.length;
      const isCategorial = isCategorialAxis(layout, axisType);

      // Eliminate duplicated axes
      const axisMap = axes.reduce((result, child) => {
        const { type, dataKey, allowDataOverflow } = child.props;
        const axisId = child.props[axisIdKey];

        if (!result[axisId]) {
          let domain, duplicateDomain;

          if (dataKey) {
            domain = getDomainOfDataByKey(displayedData, dataKey, type);
            const duplicate = hasDuplicate(domain);

            duplicateDomain = duplicate ? domain : null;
            // When axis has duplicated text, serial numbers are used to generate scale
            domain = duplicate ? _.range(0, len) : domain;
          } else if (stackGroups && stackGroups[axisId] && stackGroups[axisId].hasStack
            && type === 'number') {
            domain = getDomainOfStackGroups(
              stackGroups[axisId].stackGroups, dataStartIndex, dataEndIndex
            );
          } else if (isCategorial) {
            domain = _.range(0, len);
          } else {
            domain = getDomainOfItemsWithSameAxis(
              displayedData, items.filter(entry => entry.props[axisIdKey] === axisId), type
            );
          }
          if (type === 'number') {
            // To detect wether there is any reference lines whose props alwaysShow is true
            domain = detectReferenceElementsDomain(children, domain, axisId, axisType);

            if (child.props.domain) {
              domain = parseSpecifiedDomain(child.props.domain, domain, allowDataOverflow);
            }
          }

          return {
            ...result,
            [axisId]: {
              ...child.props,
              axisType,
              domain,
              duplicateDomain,
              originalDomain: child.props.domain,
            },
          };
        }

        return result;
      }, {});
      return axisMap;
    }

    /**
     * Get the configuration of axis by the options of item,
     * this kind of axis does not display in chart
     * @param  {Array} items       The instances of item
     * @param  {ReactElement} Axis Axis Component
     * @param  {String} axisType   The type of axis, xAxis - x-axis, yAxis - y-axis
     * @param  {String} axisIdKey  The unique id of an axis
     * @param  {Object} stackGroups The items grouped by axisId and stackId
		 * @param {Number} dataStartIndex The start index of the data series when a brush is applied
		 * @param {Number} dataEndIndex The end index of the data series when a brush is applied
     * @return {Object}            Configuration
     */
    getAxisMapByItems({ items, Axis, axisType, axisIdKey,
			stackGroups, dataStartIndex, dataEndIndex }) {

      const { layout, children, data } = this.props;
      const displayedData = data.slice(dataStartIndex, dataEndIndex + 1);
      const len = displayedData.length;
      const isCategorial = isCategorialAxis(layout, axisType);
      let index = -1;

      // The default type of x-axis is category axis,
      // The default contents of x-axis is the serial numbers of data
      // The default type of y-axis is number axis
      // The default contents of y-axis is the domain of data
      const axisMap = items.reduce((result, child) => {
        const axisId = child.props[axisIdKey];

        if (!result[axisId]) {
          index++;
          let domain;

          if (isCategorial) {
            domain = _.range(0, len);
          } else if (stackGroups && stackGroups[axisId] && stackGroups[axisId].hasStack) {
            domain = getDomainOfStackGroups(
              stackGroups[axisId].stackGroups, dataStartIndex, dataEndIndex
            );
            domain = detectReferenceElementsDomain(children, domain, axisId, axisType);
          } else {
            domain = parseSpecifiedDomain(Axis.defaultProps.domain,
              getDomainOfItemsWithSameAxis(
                displayedData,
                items.filter(entry => entry.props[axisIdKey] === axisId), 'number'
              ),
              Axis.defaultProps.allowDataOverflow
            );
            domain = detectReferenceElementsDomain(children, domain, axisId, axisType);
          }

          return {
            ...result,
            [axisId]: {
              axisType,
              ...Axis.defaultProps,
              hide: true,
              orientation: ORIENT_MAP[axisType][index % 2],
              domain,
              originalDomain: Axis.defaultProps.domain,
            },
          };
        }

        return result;
      }, {});

      return axisMap;
    }
    /**
     * Calculate the scale function, position, width, height of axes
     * @param  {Object} axisMap  The configuration of axes
     * @param  {Object} offset   The offset of main part in the svg element
     * @param  {Object} axisType The type of axes, x-axis or y-axis
     * @return {Object} Configuration
     */
    getFormatAxisMap(axisMap, offset, axisType) {
      const { width, height, layout } = this.props;
      const displayName = this.constructor.displayName;
      const ids = Object.keys(axisMap);
      const steps = {
        left: offset.left,
        right: width - offset.right,
        top: offset.top,
        bottom: height - offset.bottom,
      };

      return ids.reduce((result, id) => {
        const axis = axisMap[id];
        const { orientation, type, domain, padding = {} } = axis;
        let range, scale, x, y;

        if (axisType === 'xAxis') {
          range = [
            offset.left + (padding.left || 0),
            offset.left + offset.width - (padding.right || 0),
          ];
        } else {
          range = layout === 'horizontal' ? [
            offset.top + offset.height - (padding.bottom || 0),
            offset.top + (padding.top || 0),
          ] : [
            offset.top + (padding.top || 0),
            offset.top + offset.height - (padding.bottom || 0),
          ];
        }

        if (type === 'number') {
          scale = scaleLinear().domain(domain).range(range);
        } else if (displayName.indexOf('LineChart') >= 0 ||
          displayName.indexOf('AreaChart') >= 0) {
          scale = scalePoint().domain(domain).range(range);
        } else {
          scale = scaleBand().domain(domain).range(range);
        }

        const ticks = getTicksOfScale(scale, axis);

        if (axisType === 'xAxis') {
          x = offset.left;
          y = orientation === 'top' ? steps[orientation] - axis.height : steps[orientation];
        } else {
          x = orientation === 'left' ? steps[orientation] - axis.width : steps[orientation];
          y = offset.top;
        }

        const finalAxis = {
          ...axis,
          ...ticks,
          x, y, scale,
          width: axisType === 'xAxis' ? offset.width : axis.width,
          height: axisType === 'yAxis' ? offset.height : axis.height,
        };

        if (!axis.hide && axisType === 'xAxis') {
          steps[orientation] += (orientation === 'top' ? -1 : 1) * finalAxis.height;
        } else if (!axis.hide) {
          steps[orientation] += (orientation === 'left' ? -1 : 1) * finalAxis.width;
        }

        return { ...result, [id]: finalAxis };
      }, {});
    }
    /**
     * Get the information of mouse in chart, return null when the mouse is not in the chart
     * @param  {Object}  xAxisMap The configuration of all x-axes
     * @param  {Object}  yAxisMap The configuration of all y-axes
     * @param  {Object}  offset   The offset of main part in the svg element
     * @param  {Object}  e        The event object
     * @return {Object}           Mouse data
     */
    getMouseInfo(xAxisMap, yAxisMap, offset, e) {
      const isIn = e.chartX >= offset.left
        && e.chartX <= offset.left + offset.width
        && e.chartY >= offset.top
        && e.chartY <= offset.top + offset.height;

      if (!isIn) { return null; }

      const { layout } = this.props;
      const { tooltipTicks: ticks } = this.state;
      const pos = layout === 'horizontal' ? e.chartX : e.chartY;
      const activeIndex = calculateActiveTickIndex(pos, ticks);

      if (activeIndex >= 0) {
        return {
          ...e,
          activeTooltipIndex: activeIndex,
        };
      }

      return null;
    }

    /**
     * Get the content to be displayed in the tooltip
     * @param  {Array} items The instances of item
     * @return {Array}       The content of tooltip
     */
    getTooltipContent(items) {
      const { activeTooltipIndex, dataStartIndex, dataEndIndex } = this.state;
      const data = this.props.data.slice(dataStartIndex, dataEndIndex + 1);

      if (activeTooltipIndex < 0 || !items || !items.length
        || activeTooltipIndex >= data.length) {
        return null;
      }

      return items.map((child) => {
        const { dataKey, name, unit, formatter } = child.props;

        return {
          ...getPresentationAttributes(child),
          dataKey, unit, formatter,
          name: name || dataKey,
          color: getMainColorOfGraphicItem(child),
          value: data[activeTooltipIndex][dataKey],
          payload: data[activeTooltipIndex],
        };
      });
    }

		/**
		 * The AxisMaps are expensive to render on large data sets
		 * so provide the ability to store them in state and only update them when necessary
		 * they are dependent upon the start and end index of
		 * the brush so it's important that this method is called _after_
		 * the state is updated with any new start/end indices
		 *
		 * @param {Object} props The props object to be used for updating the axismaps
		 * @param {Number} dataStartIndex The start index of the data series when a brush is applied
		 * @param {Number} dataEndIndex The end index of the data series when a brush is applied
		 * @return {Object} state New state to set
		 */
    updateStateOfAxisMapsOffsetAndStackGroups({ props, dataStartIndex, dataEndIndex }) {
      const { data } = props;
      if (!validateWidthHeight({ props }) || !data || !data.length) { return {}; }

      const { children, layout, stackOffset } = props;
      const numericIdName = layout === 'horizontal' ? 'yAxis' : 'xAxis';
      const cateIdName = layout === 'horizontal' ? 'xAxis' : 'yAxis';
      const items = findAllByType(children, GraphicalChild);
      const stackGroups = getStackGroupsByAxisId(
        data, items, `${numericIdName}Id`, `${cateIdName}Id`, stackOffset
      );

      let xAxisMap = this.getAxisMap({
        axisType: 'xAxis',
        items,
        stackGroups: numericIdName === 'xAxis' && stackGroups,
        dataStartIndex,
        dataEndIndex,
      });

      let yAxisMap = this.getAxisMap({
        axisType: 'yAxis',
        items,
        stackGroups: numericIdName === 'yAxis' && stackGroups,
        dataStartIndex,
        dataEndIndex,
      });

      const offset = this.calculateOffset(items, xAxisMap, yAxisMap);

      xAxisMap = this.getFormatAxisMap(xAxisMap, offset, 'xAxis');
      yAxisMap = this.getFormatAxisMap(yAxisMap, offset, 'yAxis');

      const tooltipTicks = this.tooltipTicksGenerator({ layout, xAxisMap, yAxisMap });

      return { xAxisMap, yAxisMap, offset, stackGroups, tooltipTicks };
    }

    /* eslint-disable  no-underscore-dangle */
    addListener() {
      eventCenter.on(SYNC_EVENT, this.handleReceiveSyncEvent);

      if (eventCenter.setMaxListeners && eventCenter._maxListeners) {
        eventCenter.setMaxListeners(eventCenter._maxListeners + 1);
      }
    }
    removeListener() {
      eventCenter.removeListener(SYNC_EVENT, this.handleReceiveSyncEvent);

      if (eventCenter.setMaxListeners && eventCenter._maxListeners) {
        eventCenter.setMaxListeners(eventCenter._maxListeners - 1);
      }
    }
    /**
     * Returns default, reset state for the categorical chart.
     * @param {Object} props Props object to use when creating the default state
     * @return {Object} Whole new state
     */
    createDefaultState(props) {
      return {
        chartX: 0,
        chartY: 0,
        dataStartIndex: 0,
        dataEndIndex: (props.data && (props.data.length - 1)) || 0,
        activeTooltipIndex: -1,
        isTooltipActive: false,
      };
    }
    /**
     * Calculate the offset of main part in the svg element
     * @param  {Array} items       The instances of item
     * @param  {Object} xAxisMap  The configuration of x-axis
     * @param  {Object} yAxisMap  The configuration of y-axis
     * @return {Object} The offset of main part in the svg element
     */
    calculateOffset(items, xAxisMap, yAxisMap) {
      const { width, height, children } = this.props;
      const margin = this.props.margin || {};
      const brushItem = findChildByType(children, Brush);

      const offsetH = Object.keys(yAxisMap).reduce((result, id) => {
        const entry = yAxisMap[id];
        const orientation = entry.orientation;

        return { ...result, [orientation]: result[orientation] + (entry.hide ? 0 : entry.width) };
      }, { left: margin.left || 0, right: margin.right || 0 });

      const offsetV = Object.keys(xAxisMap).reduce((result, id) => {
        const entry = xAxisMap[id];
        const orientation = entry.orientation;

        return { ...result, [orientation]: result[orientation] + (entry.hide ? 0 : entry.height) };
      }, { top: margin.top || 0, bottom: margin.bottom || 0 });

      const brushBottom = offsetV.bottom;

      if (brushItem && !brushItem.props.overlayChart) {
        offsetV.bottom += brushItem.props.height || Brush.defaultProps.height;
      }

      const legendProps = getLegendProps(children, items, width);
      if (legendProps) {
        const box = Legend.getLegendBBox(legendProps, width, height) || {};
        if (legendProps.layout === 'horizontal' &&
          _.isNumber(offsetV[legendProps.verticalAlign])) {
          offsetV[legendProps.verticalAlign] += box.height || 0;
        } else if (legendProps.layout === 'vertical' &&
          _.isNumber(offsetH[legendProps.align])) {
          offsetH[legendProps.align] += box.width || 0;
        }
      }

      return {
        brushBottom,
        ...offsetH,
        ...offsetV,
        width: width - offsetH.left - offsetH.right,
        height: height - offsetV.top - offsetV.bottom,
      };
    }

    handleReceiveSyncEvent = (cId, chartId, data) => {
      const { syncId } = this.props;

      if (syncId === cId && chartId !== this.uniqueChartId) {
        this.setState(data);
        const { dataStartIndex, dataEndIndex } = data;
        if (data.dataStartIndex || data.dataEndIndex) {
          this.setState(this.updateStateOfAxisMapsOffsetAndStackGroups(
						{ props: this.props, dataStartIndex, dataEndIndex }
					));
        }
      }
    };

		/**
		 * update the state with the new brush extents.  Synchronize with other charts as appropriate.
		 * Outcome depends on affectedCharts property.  If 'all' (default), update this graph and the
		 * sync'd graphs.  If 'self', update this graph but not sync'd graphs.  If 'others', update
		 * other graphs but not this one
		 *
		 * @return {Boolean} true if it updated the state, false otherwise
		 */
    handleBrushChange = ({ startIndex = this.state.dataStartIndex,
			endIndex = this.state.dataEndIndex, ...otherProps }) => {

      const brushItem = findChildByType(otherProps.children, Brush);
      let affectedCharts = 'all';
      if (brushItem && brushItem.props.affectedCharts) {
        affectedCharts = brushItem.props.affectedCharts;
      }

			// Only trigger changes if the extents of the brush have actually changed
      if (startIndex !== this.state.dataStartIndex || endIndex !== this.state.dataEndIndex) {
        if (affectedCharts !== 'self') {
          this.triggerSyncEvent({
            dataStartIndex: startIndex,
            dataEndIndex: endIndex,
          });
        }
        if (affectedCharts !== 'others') {
          this.setState({
            dataStartIndex: startIndex,
            dataEndIndex: endIndex,
            ...this.updateStateOfAxisMapsOffsetAndStackGroups(
							{ props: otherProps, dataStartIndex: startIndex, dataEndIndex: endIndex }
						),
          });
          return true;
        }
      }
      return false;
    };

    handleBrushChangeForThis = ({ startIndex, endIndex }) =>
			this.handleBrushChange({ ...this.props, startIndex, endIndex });

    /**
     * The handler of mouse entering chart
     * @param  {Object} offset   The offset of main part in the svg element
     * @param  {Object} xAxisMap The configuration of all x-axes
     * @param  {Object} yAxisMap The configuration of all y-axes
     * @param  {Object} e        Event object
     * @return {Null}            null
     */
    handleMouseEnter(offset, xAxisMap, yAxisMap, e) {
      const container = ReactDOM.findDOMNode(this);
      const containerOffset = getOffset(container);
      const ne = calculateChartCoordinate(e, containerOffset);
      const mouse = this.getMouseInfo(xAxisMap, yAxisMap, offset, ne);

      if (mouse) {
        const nextState = { ...mouse, isTooltipActive: true };
        this.setState(nextState);
        this.triggerSyncEvent(nextState);
      }
    }

    /**
     * The handler of mouse moving in chart
     * @param  {Object} offset   The offset of main part in the svg element
     * @param  {Object} xAxisMap The configuration of all x-axes
     * @param  {Object} yAxisMap The configuration of all y-axes
     * @param  {Object} e        Event object
     * @return {Null} no return
     */
    handleMouseMove(offset, xAxisMap, yAxisMap, e) {
      const container = ReactDOM.findDOMNode(this);
      const containerOffset = getOffset(container);
      const ne = calculateChartCoordinate(e, containerOffset);
      const mouse = this.getMouseInfo(xAxisMap, yAxisMap, offset, ne);
      const nextState = mouse ? { ...mouse, isTooltipActive: true } : { isTooltipActive: false };

      this.setState(nextState);
      this.triggerSyncEvent(nextState);
    }
    /**
     * The handler if mouse leaving chart
     * @return {Null} no return
     */
    handleMouseLeave = () => {
      const nextState = { isTooltipActive: false };

      this.setState(nextState);
      this.triggerSyncEvent(nextState);
    };

    validateAxes() {
      const { layout, children } = this.props;
      const xAxes = findAllByType(children, XAxis);
      const yAxes = findAllByType(children, YAxis);

      if (layout === 'horizontal' && xAxes && xAxes.length) {
        xAxes.forEach((axis) => {
          warn(axis.props.type === 'category',
            'x-axis should be category axis when the layout is horizontal'
          );
        });
      } else if (layout === 'vertical') {
        const displayName = this.constructor.displayName;

        warn(yAxes && yAxes.length,
          `You should add <YAxis type="number" /> in ${displayName}.
           The layout is vertical now, y-axis should be category axis,
           but y-axis is number axis when no YAxis is added.`
        );
        warn(xAxes && xAxes.length,
          `You should add <XAxis /> in ${displayName}.
          The layout is vertical now, x-axis is category when no XAxis is added.`
        );

        if (yAxes && yAxes.length) {
          yAxes.forEach((axis) => {
            warn(axis.props.type === 'category',
              'y-axis should be category axis when the layout is vertical'
            );
          });
        }
      }

      return null;
    }

    triggerSyncEvent(data) {
      const { syncId } = this.props;

      if (!_.isNil(syncId)) {
        eventCenter.emit(SYNC_EVENT, syncId, this.uniqueChartId, data);
      }
    }

    verticalCoordinatesGenerator = ({ xAxis, width, height, offset }) =>
      getCoordinatesOfGrid(CartesianAxis.getTicks({
        ...xAxis,
        ticks: getTicksOfAxis(xAxis, true),
        viewBox: { x: 0, y: 0, width, height },
      }), offset.left, offset.left + offset.width);

    horizontalCoordinatesGenerator = ({ yAxis, width, height, offset }) =>
      getCoordinatesOfGrid(CartesianAxis.getTicks({
        ...yAxis,
        ticks: getTicksOfAxis(yAxis, true),
        viewBox: { x: 0, y: 0, width, height },
      }), offset.top, offset.top + offset.height);

    axesTicksGenerator = axis => getTicksOfAxis(axis, true);

    tooltipTicksGenerator = ({ layout, xAxisMap, yAxisMap }) => {
      const axisMap = layout === 'horizontal' ? xAxisMap : yAxisMap;
      const axis = getAnyElementOfObject(axisMap);
      return getTicksOfAxis(axis, false, true);
    }

    /**
     * Draw axes
     * @param {Object} axisMap The configuration of all x-axes or y-axes
     * @param {String} name    The name of axes
		 * @param {Component} Axis The Axis (e.g. XAxis)
     * @return {ReactElement}  The instance of x-axes
     */
    renderAxes(axisMap, name, Axis) {
      const { width, height } = this.props;
      const ids = axisMap && Object.keys(axisMap);

      if (ids && ids.length) {
        const axes = [];

        for (let i = 0, len = ids.length; i < len; i++) {
          const axisProps = axisMap[ids[i]];

          if (!axisProps.hide) {

            axes.push((
              <Axis
                {...axisProps}
                key={`${name}-${ids[i]}`}
                viewBox={{ x: 0, y: 0, width, height }}
                ticksGenerator={this.axesTicksGenerator}
              />
            ));
          }
        }

        return axes.length ?
          <Layer key={`${name}-layer`} className={`recharts-${name}`}>{axes}</Layer> : null;
      }

      return null;
    }

    /**
     * Draw grid
     * @param  {Object} xAxisMap The configuration of all x-axes
     * @param  {Object} yAxisMap The configuration of all y-axes
     * @param  {Object} offset   The offset of main part in the svg element
     * @return {ReactElement} The instance of grid
     */
    renderGrid(xAxisMap, yAxisMap, offset) {
      const { children, width, height } = this.props;
      const gridItem = findChildByType(children, CartesianGrid);

      if (!gridItem) { return null; }

      const xAxis = getAnyElementOfObject(xAxisMap);
      const yAxis = getAnyElementOfObject(yAxisMap);

      return React.cloneElement(gridItem, {
        key: 'grid',
        x: offset.left,
        y: offset.top,
        width: offset.width,
        height: offset.height,
        xAxis,
        yAxis,
        offset,
        chartWidth: width,
        chartHeight: height,
        verticalCoordinatesGenerator: this.verticalCoordinatesGenerator,
        horizontalCoordinatesGenerator: this.horizontalCoordinatesGenerator,
      });
    }
    /**
     * Draw legend
     * @param  {Array} items             The instances of item
     * @return {ReactElement}            The instance of Legend
     */
    renderLegend(items) {
      const { children, width, height } = this.props;
      const margin = this.props.margin || {};
      const legendWidth = width - (margin.left || 0) - (margin.right || 0);
      const legendHeight = height - (margin.top || 0) - (margin.bottom || 0);
      const props = getLegendProps(children, items, legendWidth, legendHeight);

      if (!props) { return null; }

      return React.createElement(Legend, {
        ...props,
        chartWidth: width,
        chartHeight: height,
        margin,
      });
    }


    /**
     * Draw Tooltip
     * @param  {ReactElement} tooltipItem  The instance of Tooltip
     * @param  {Array} items  The instances of GraphicalChild
     * @param  {Object} offset The offset of main part in the svg element
     * @return {ReactElement}  The instance of Tooltip
     */
    renderTooltip({ tooltipItem, items, offset }) {
      const { layout } = this.props;
      const { isTooltipActive, activeTooltipIndex, chartX, chartY, tooltipTicks } = this.state;

      const viewBox = { ...offset, x: offset.left, y: offset.top };
      // When a categotical chart is combined with another chart, the value of chartX
      // and chartY may beyond the boundaries.
      const validateChartX = Math.min(chartX, viewBox.x + viewBox.width);
      const validateChartY = Math.min(chartY, viewBox.y + viewBox.height);

      return React.cloneElement(tooltipItem, {
        viewBox,
        active: isTooltipActive,
        label: tooltipTicks[activeTooltipIndex] && tooltipTicks[activeTooltipIndex].value,
        payload: isTooltipActive ? this.getTooltipContent(items) : [],
        coordinate: tooltipTicks[activeTooltipIndex] ? {
          x: layout === 'horizontal' ? tooltipTicks[activeTooltipIndex].coordinate : validateChartX,
          y: layout === 'horizontal' ? validateChartY : tooltipTicks[activeTooltipIndex].coordinate,
        } : originCoordinate,
      });
    }

    renderBrush(xAxisMap, yAxisMap, offset) {
      const { children, margin, data } = this.props;
      const { dataStartIndex, dataEndIndex } = this.state;
      const brushItem = findChildByType(children, Brush);

      if (!brushItem) { return null; }

      let y = offset.top + offset.height + offset.brushBottom - (margin.bottom || 0);
      let overrideHeight = {};
      if (brushItem.props.overlayChart) {
        y = offset.top;
        overrideHeight = { height: offset.height };
      }

      const onChange = [this.handleBrushChangeForThis];
      if (brushItem.props.onChange) onChange.push(brushItem.props.onChange);

      return React.cloneElement(brushItem, {
        onChange,
        data,
        x: offset.left,
        y,
        width: offset.width,
        ...overrideHeight,
        startIndex: dataStartIndex,
        endIndex: dataEndIndex,
      });

    }

    renderReferenceElements(xAxisMap, yAxisMap, offset, isFront, Compt) {
      const { children } = this.props;
      const elements = findAllByType(children, Compt);

      if (!elements || !elements.length) { return null; }

      const keyPrefix = `${getDisplayName(Compt)}-${isFront ? 'front' : 'back'}`;

      return elements.filter(entry => (isFront === entry.props.isFront)).map((entry, i) => {
        const { xAxisId, yAxisId } = entry.props;

        return React.cloneElement(entry, {
          key: `${keyPrefix}-${i}`,
          xAxis: xAxisMap[xAxisId],
          yAxis: yAxisMap[yAxisId],
          viewBox: {
            x: offset.left,
            y: offset.top,
            width: offset.width,
            height: offset.height,
          },
        });
      });
    }

    render() {
      const { data } = this.props;
      if (!validateWidthHeight(this) || !data || !data.length) { return null; }

      const { children, className, width, height, style,
        ...others } = this.props;
      const { xAxisMap, yAxisMap, offset, stackGroups } = this.state;
      const items = findAllByType(children, GraphicalChild);

      const tooltipItem = findChildByType(children, Tooltip);
      const events = tooltipItem ? {
        onMouseEnter: this.handleMouseEnter.bind(this, offset, xAxisMap, yAxisMap),
        onMouseMove: this.handleMouseMove.bind(this, offset, xAxisMap, yAxisMap),
        onMouseLeave: this.handleMouseLeave,
      } : null;
      const attrs = getPresentationAttributes(others);

      return (
        <div
          className={classNames('recharts-wrapper', className)}
          style={{ ...style, position: 'relative', cursor: 'default', width, height }}
          {...events}
        >
          <Surface {...attrs} width={width} height={height}>
            {this.renderGrid(xAxisMap, yAxisMap, offset)}
            {this.renderReferenceElements(xAxisMap, yAxisMap, offset, false, ReferenceArea)}
            {this.renderReferenceElements(xAxisMap, yAxisMap, offset, false, ReferenceLine)}
            {this.renderReferenceElements(xAxisMap, yAxisMap, offset, false, ReferenceDot)}
            {this.renderAxes(xAxisMap, 'x-axis', XAxis)}
            {this.renderAxes(yAxisMap, 'y-axis', YAxis)}
            <ChartComponent
              {...this.props}
              {...this.state}
              graphicalItems={items}
              xAxisMap={xAxisMap}
              yAxisMap={yAxisMap}
              offset={offset}
              stackGroups={stackGroups}
            />
            {this.renderReferenceElements(xAxisMap, yAxisMap, offset, true, ReferenceArea)}
            {this.renderReferenceElements(xAxisMap, yAxisMap, offset, true, ReferenceLine)}
            {this.renderReferenceElements(xAxisMap, yAxisMap, offset, true, ReferenceDot)}
            {this.renderBrush(xAxisMap, yAxisMap, offset)}
            {filterSvgElements(children)}
          </Surface>
          {this.renderLegend(items)}
          {tooltipItem && this.renderTooltip({ tooltipItem,
						items, offset })}
        </div>
      );
    }
  }

  return CategoricalChartWrapper;
};

export default generateCategoricalChart;
