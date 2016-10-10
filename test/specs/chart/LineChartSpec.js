/* eslint-disable max-len, react/prop-types, react/jsx-indent, react/prop-types */
import React from 'react';
import { expect } from 'chai';
// eslint-disable-next-line import/no-unresolved
import { LineChart, Line, Curve, XAxis, YAxis, CartesianAxis, CartesianGrid, Tooltip, Brush, Legend } from 'recharts';
import { mount, render } from 'enzyme';
import sinon from 'sinon';

const data = [
	{ name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
	{ name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
	{ name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
	{ name: 'Page D', uv: 200, pv: 9800, amt: 2400 },
	{ name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
	{ name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
];

describe('<LineChart />', () => {

  it('Render 1 line in simple LineChart', () => {
    const wrapper = render(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line type="monotone" dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    expect(wrapper.find('.recharts-line .recharts-line-curve').length).to.equal(1);
  });

  it('Render 1 line in simple LineChart', () => {
    const wrapper = render(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis />
        <YAxis type="category" />
        <Line type="monotone" dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    expect(wrapper.find('.recharts-line .recharts-line-curve').length).to.equal(1);
  });

  it('Renders customized active dot when activeDot is set to be a ReactElement', () => {
    const ActiveDot = ({ cx, cy }) =>
      <circle cx={cx} cy={cy} r={10} className="customized-active-dot" />;

    const wrapper = mount(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line activeDot={<ActiveDot />} type="monotone" dataKey="uv" stroke="#ff7300" />
        <Tooltip />
      </LineChart>
    );

    wrapper.setState({
      isTooltipActive: true,
      activeTooltipIndex: 4,
      activeTooltipLabel: 4,
      activeTooltipCoord: {
        x: 95,
        y: 21,
      },
    });
    expect(wrapper.find(ActiveDot).length).to.equal(1);
  });

  it('Renders customized active dot when activeDot is set to be a function', () => {
    const renderActiveDot = ({ cx, cy }) =>
      <circle cx={cx} cy={cy} r={10} className="customized-active-dot" />;

    const wrapper = mount(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line activeDot={renderActiveDot} type="monotone" dataKey="uv" stroke="#ff7300" />
        <Tooltip />
      </LineChart>
    );

    wrapper.setState({
      isTooltipActive: true,
      activeTooltipIndex: 4,
      activeTooltipLabel: 4,
      activeTooltipCoord: {
        x: 95,
        y: 21,
      },
    });

    // expect(wrapper.find(ActiveDot).length).to.equal(1);
  });

  it('Render 1 line in simple LineChart', () => {
    const wrapper = render(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line strokeDasharray="5 5" type="monotone" dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    expect(wrapper.find('.recharts-line .recharts-line-curve').length).to.equal(1);
  });

  it('Renders 1 dot no line when the length of data is 1', () => {
    const wrapper = render(
      <LineChart width={400} height={400} data={data.slice(0, 1)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line isAnimationActive={false} label type="monotone" dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    expect(wrapper.find('.recharts-line .recharts-line-curve').length).to.equal(0);
    expect(wrapper.find('.recharts-line .recharts-line-dot').length).to.equal(1);
  });

  it('Renders 6 labels when label is setted to be true', () => {
    const wrapper = render(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line isAnimationActive={false} label type="monotone" dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    expect(wrapper.find('.recharts-line-label').length).to.equal(6);
  });

  it('Renders 6 labels when label is setted to be a function', () => {
    const renderLabel = (props) => {
      const { x, y, key } = props;
      return <text className="customized-label" x={x} y={y} key={key}>test</text>;
    };
    const wrapper = render(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line isAnimationActive={false} label={renderLabel} dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    const labels = wrapper.find('.customized-label');

    expect(labels.length).to.equal(6);
  });

  it('Renders 6 labels when label is setted to be a react element', () => {
    const CustomizedLabel = (props) => {
      const { x, y, key } = props;
      return <text className="customized-label" x={x} y={y} key={key}>test</text>;
    };
    const wrapper = render(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line isAnimationActive={false} label={<CustomizedLabel />} dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    const labels = wrapper.find('.customized-label');

    expect(labels.length).to.equal(6);
  });

  it('Renders 6 dots when dot is setted to be true', () => {
    const wrapper = render(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line isAnimationActive={false} dot type="monotone" dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    expect(wrapper.find('.recharts-line-dot').length).to.equal(6);
  });

  it('Renders 6 dots when dot is setted to be a function', () => {
    const renderDot = (props) => {
      const { cx, cy, key } = props;

      return <circle className="customized-dot" key={key} cx={cx} cy={cy} r={10} />;
    };
    const wrapper = render(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line isAnimationActive={false} dot={renderDot} type="monotone" dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    expect(wrapper.find('.customized-dot').length).to.equal(6);
  });

  it('Renders 6 dots when dot is setted to be a react element', () => {
    const Dot = (props) => {
      const { cx, cy, key } = props;

      return <circle className="customized-dot" key={key} cx={cx} cy={cy} r={10} />;
    };
    const wrapper = render(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line isAnimationActive={false} dot={<Dot />} type="monotone" dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    expect(wrapper.find('.customized-dot').length).to.equal(6);
  });

  it('click on Curve should invoke onClick callback', () => {
    const wrapper = mount(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line type="monotone" dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    wrapper.setProps({ data: [] });
  });

  it('click on Curve should invoke onClick callback', () => {
    const onClick = sinon.spy();
    const wrapper = mount(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line onClick={onClick} type="monotone" dataKey="uv" stroke="#ff7300" />
      </LineChart>
    );
    const curve = wrapper.find(Curve);
    curve.simulate('click');
    expect(onClick.calledOnce).to.equal(true);
  });

  it('should show tooltip cursor on MouseEnter and MouseMove and hide on MouseLeave', () => {
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const height = 400;
    const width = 400;
    const wrapper = mount(
      <LineChart width={width} height={height} data={data} margin={margin}>
        <Line isAnimationActive={false} type="monotone" dataKey="uv" stroke="#ff7300" />
        <Tooltip />
        <Brush />
        <Legend layout="vertical" />
      </LineChart>
    );

		// simulate entering just past Page A to test snapping of the cursor line
    expect(wrapper.find('.recharts-tooltip-cursor').length).to.equal(0);
    wrapper.simulate('mouseEnter', { pageX: margin.left + 10, pageY: height / 2 });

    let tooltipCursors = wrapper.find('.recharts-tooltip-cursor');
    expect(tooltipCursors.length).to.equal(1);

		// make sure tooltip is in the right spot.
    const chartBottom = height - margin.top - 2 * margin.bottom;
    let expectedX = margin.left;
    expect(tooltipCursors.at(0).props().d).to.equal(`M${expectedX},${margin.top}L${expectedX},${chartBottom}`);

		// simulate moving 10 pixels past the PageC Dot
    const chartWidth = width - margin.left - margin.right;
    const dotSpacing = chartWidth / (data.length - 1);
    expectedX = margin.left + dotSpacing * 2;
    wrapper.simulate('mouseMove', { pageX: expectedX + 10, pageY: height / 2 });

    tooltipCursors = wrapper.find('.recharts-tooltip-cursor');
    expect(tooltipCursors.length).to.equal(1);


    expect(tooltipCursors.at(0).props().d).to.equal(`M${expectedX},${margin.top}L${expectedX},${chartBottom}`);

		// simulate leaving the area
    wrapper.simulate('mouseLeave');
    expect(wrapper.find('.recharts-tooltip-cursor').length).to.equal(0);

  });

  it('Should update the line chart when the brush changes', () => {
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const height = 400;
    const width = 400;
    const wrapper = mount(
      <LineChart width={width} height={height} data={data} margin={margin}>
        <Line isAnimationActive={false} type="monotone" dataKey="uv" stroke="#ff7300" />
        <Tooltip />
        <Brush />
        <Legend layout="vertical" />
      </LineChart>
    );

    const lineDots = wrapper.find('.recharts-line-dots');
    expect(lineDots.length).to.equal(1);
    expect(lineDots.children().length).to.equal(6);

		// verify one of the dots that we expect to move when the brush happens
    expect(lineDots.childAt(2).props().payload.value).to.equal(data[2].uv);
    expect(lineDots.childAt(2).props().cx).to.equal(164);
    expect(lineDots.childAt(2).props().cy).to.equal(100);

		// simulate a brush to only include the data elements at indices 2-4
    wrapper.instance().handleBrushChangeForThis({ startIndex: 2, endIndex: 4 });

		// we should only have three dots now
    const newLineDots = wrapper.find('.recharts-line-dots');
    expect(newLineDots.length).to.equal(1);
    expect(newLineDots.children().length).to.equal(3);

		// make sure the new first dot is the same as the old 2 dot, just in a new place
    expect(newLineDots.childAt(0).props().payload.value).to.equal(data[2].uv);
    expect(newLineDots.childAt(0).props().cx).to.equal(margin.left);
    expect(newLineDots.childAt(0).props().cy).to.equal(20);

		// make sure the new last dot is the same as the old 4 dot, just in the last spot
    expect(newLineDots.childAt(2).props().payload.value).to.equal(data[4].uv);
    expect(newLineDots.childAt(2).props().cx).to.equal(width - margin.right);
    expect(newLineDots.childAt(2).props().cy).to.equal(43.4666666666667);

  });


});

describe('<LineChart /> - <Brush /> affectedCharts prop', () => {
  const affectedChartsLineChart = ({ hasBrush = false, props }) =>
    <LineChart width={400} height={400} data={data} syncId="test">
      <Line isAnimationActive={false} type="monotone" dataKey="uv" stroke="#ff7300" />
			{hasBrush ? <Brush dataKey="name" {...props} /> : null}
    </LineChart>;

  const totalChart = (props) =>
    <div>
			{affectedChartsLineChart({})}
			{affectedChartsLineChart({ hasBrush: true, props })}
		</div>;

  const verifyDotsForChild = ({ lineCharts, childIndex, numDots }) => {
    const lineDots = lineCharts.at(childIndex).find('.recharts-line-dots');
    expect(lineDots.length).to.equal(1);
    expect(lineDots.at(0).children().length).to.equal(numDots);
  };

  const verifyBrushText = (wrapper, startIndex, endIndex) => {
		// mouse-over the traveller to make the text appear
    wrapper.find(Brush).get(0).handleEnterSlideOrTraveller();
    const texts = wrapper.find('.recharts-brush-texts').find('.recharts-text');
    expect(texts.length).to.equal(2);
    expect(texts.at(0).text()).to.equal(data[startIndex].name);
    expect(texts.at(1).text()).to.equal(data[endIndex].name);
  };

  it('should sync both charts when no affectedCharts prop is supplied', () => {

    const wrapper = mount(totalChart());
    const lineCharts = wrapper.find(LineChart);
    expect(lineCharts.length).to.equal(2);

		// find the lineDots from both graphs.  Both should have 6 dots at this point
    verifyDotsForChild({ lineCharts, childIndex: 0, numDots: 6 });
    verifyDotsForChild({ lineCharts, childIndex: 1, numDots: 6 });
    verifyBrushText(wrapper, 0, 5);

		// simulate a brush to only include the data elements at indices 2-4
    lineCharts.get(1).handleBrushChangeForThis({ startIndex: 2, endIndex: 4 });

		// find the lineDots from both graphs.  Both should have 3 dots at this point
    verifyDotsForChild({ lineCharts, childIndex: 0, numDots: 3 });
    verifyDotsForChild({ lineCharts, childIndex: 1, numDots: 3 });
    verifyBrushText(wrapper, 2, 4);
  });

  it('should sync both charts when affectedCharts="all" prop is supplied', () => {

    const wrapper = mount(totalChart({ affectedCharts: 'all' }));
    const lineCharts = wrapper.find(LineChart);
    expect(lineCharts.length).to.equal(2);

		// find the lineDots from both graphs.  Both should have 6 dots at this point
    verifyDotsForChild({ lineCharts, childIndex: 0, numDots: 6 });
    verifyDotsForChild({ lineCharts, childIndex: 1, numDots: 6 });
    verifyBrushText(wrapper, 0, 5);

		// simulate a brush to only include the data elements at indices 2-4
    lineCharts.get(1).handleBrushChangeForThis({ startIndex: 2, endIndex: 4 });

		// find the lineDots from both graphs.  Both should have 3 dots at this point
    verifyDotsForChild({ lineCharts, childIndex: 0, numDots: 3 });
    verifyDotsForChild({ lineCharts, childIndex: 1, numDots: 3 });
    verifyBrushText(wrapper, 2, 4);
  });

  it('should sync only self chart when affectedCharts="self" prop is supplied', () => {

    const wrapper = mount(totalChart({ affectedCharts: 'self' }));
    const lineCharts = wrapper.find(LineChart);
    expect(lineCharts.length).to.equal(2);

		// find the lineDots from both graphs.  Both should have 6 dots at this point
    verifyDotsForChild({ lineCharts, childIndex: 0, numDots: 6 });
    verifyDotsForChild({ lineCharts, childIndex: 1, numDots: 6 });
    verifyBrushText(wrapper, 0, 5);

		// simulate a brush to only include the data elements at indices 2-4
    lineCharts.get(1).handleBrushChangeForThis({ startIndex: 2, endIndex: 4 });

		// find the lineDots from both graphs.  Both should have 3 dots at this point
		// first change shouldn't change
    verifyDotsForChild({ lineCharts, childIndex: 0, numDots: 6 });
    verifyDotsForChild({ lineCharts, childIndex: 1, numDots: 3 });
    verifyBrushText(wrapper, 2, 4);
  });

  it('should sync only other chart when affectedCharts="others" prop is supplied', () => {

    const wrapper = mount(totalChart({ affectedCharts: 'others' }));
    const lineCharts = wrapper.find(LineChart);
    expect(lineCharts.length).to.equal(2);

		// find the lineDots from both graphs.  Both should have 6 dots at this point
    verifyDotsForChild({ lineCharts, childIndex: 0, numDots: 6 });
    verifyDotsForChild({ lineCharts, childIndex: 1, numDots: 6 });
    verifyBrushText(wrapper, 0, 5);

		// since props don't trickle down to Brush when affectedCharts="others"
		// we can't cheat by using the Charts handleBrushChange method
		// need to actually simulate mouse actions
    const brush = wrapper.find(Brush).get(0);
    brush.handleTravellerDown('startX', { pageX: brush.scale(0) });
    brush.handleTravellerMove({ pageX: brush.scale(2) });
    brush.handleUp();
    verifyBrushText(wrapper, 2, 5);
    brush.handleTravellerDown('endX', { pageX: brush.scale(5) });
    brush.handleTravellerMove({ pageX: brush.scale(4) });
    brush.handleUp();
    verifyBrushText(wrapper, 2, 4);

		// find the lineDots from both graphs.  Both should have 3 dots at this point
		// first change shouldn't change
    verifyDotsForChild({ lineCharts, childIndex: 0, numDots: 3 });
    verifyDotsForChild({ lineCharts, childIndex: 1, numDots: 6 });

  });

  it('should call a supplied onChange function to Brush in addition to handleBrushChange', () => {

    const onChangeSpy = sinon.spy();
    const wrapper = mount(totalChart({ onChange: onChangeSpy }));

    expect(onChangeSpy.callCount).to.equal(0);
		// since props don't trickle down to Brush when affectedCharts="others"
		// we can't cheat by using the Charts handleBrushChange method
		// need to actually simulate mouse actions
    const brush = wrapper.find(Brush).get(0);
    brush.handleTravellerDown('startX', { pageX: brush.scale(0) });
    brush.handleTravellerMove({ pageX: brush.scale(2) });
    brush.handleUp();

    expect(onChangeSpy.callCount).to.equal(1);
    expect(onChangeSpy.getCall(0).args).to.eql([{ startIndex: 2, endIndex: 5 }]);

    brush.handleTravellerDown('endX', { pageX: brush.scale(5) });
    brush.handleTravellerMove({ pageX: brush.scale(4) });
    brush.handleUp();

    expect(onChangeSpy.callCount).to.equal(2);
    expect(onChangeSpy.getCall(1).args).to.eql([{ startIndex: 2, endIndex: 4 }]);

  });

});


describe('<LineChart /> - startIndex and endIndex', () => {
  const chart = (props) =>
    <LineChart width={400} height={400} data={data} syncId="test" {...props}>
      <Line isAnimationActive={false} type="monotone" dataKey="uv" stroke="#ff7300" />
			<Brush />
    </LineChart>;

  const verifyDots = ({ wrapper, numDots, startIndex, endIndex }) => {
    const lineDots = wrapper.find('.recharts-line-dots');
    expect(lineDots.length).to.equal(1);
    expect(lineDots.at(0).children().length).to.equal(numDots);
    expect(lineDots.childAt(0).props().payload.value).to.equal(data[startIndex].uv);
    expect(lineDots.childAt(numDots - 1).props().payload.value).to.equal(data[endIndex].uv);
  };

  it('should display from startIndex to end if only startIndex is defined', () => {

    const wrapper = mount(chart({ startIndex: 2 }));

		// make sure the right dots are shown
    verifyDots({ wrapper, numDots: 4, startIndex: 2, endIndex: 5 });

		// make sure the brush is in the right position
    let brushProps = wrapper.find(Brush).at(0).props();
    expect(brushProps.startIndex).to.equal(2);
    expect(brushProps.endIndex).to.equal(5);

		// make sure brush still works
    wrapper.instance().handleBrushChangeForThis({ startIndex: 0, endIndex: 3 });

		// makek sure the right dots are shown
    verifyDots({ wrapper, numDots: 4, startIndex: 0, endIndex: 3 });
    brushProps = wrapper.find(Brush).at(0).props();
    expect(brushProps.startIndex).to.equal(0);
    expect(brushProps.endIndex).to.equal(3);
  });

  it('should display from 0 to endIndex if only endIndex is defined', () => {

    const wrapper = mount(chart({ endIndex: 3 }));

		// make sure the right dots are shown
    verifyDots({ wrapper, numDots: 4, startIndex: 0, endIndex: 3 });

		// make sure the brush is in the right position
    let brushProps = wrapper.find(Brush).at(0).props();
    expect(brushProps.startIndex).to.equal(0);
    expect(brushProps.endIndex).to.equal(3);

		// make sure brush still works
    wrapper.instance().handleBrushChangeForThis({ startIndex: 2, endIndex: 3 });

		// makek sure the right dots are shown
    verifyDots({ wrapper, numDots: 2, startIndex: 2, endIndex: 3 });
    brushProps = wrapper.find(Brush).at(0).props();
    expect(brushProps.startIndex).to.equal(2);
    expect(brushProps.endIndex).to.equal(3);
  });

  it('should display from startIndex to endIndex if both are defined', () => {

    const wrapper = mount(chart({ startIndex: 2, endIndex: 3 }));

		// make sure the right dots are shown
    verifyDots({ wrapper, numDots: 2, startIndex: 2, endIndex: 3 });

		// make sure the brush is in the right position
    let brushProps = wrapper.find(Brush).at(0).props();
    expect(brushProps.startIndex).to.equal(2);
    expect(brushProps.endIndex).to.equal(3);

    wrapper.instance().handleBrushChangeForThis({ startIndex: 4, endIndex: 5 });

		// makek sure the right dots are shown
    verifyDots({ wrapper, numDots: 2, startIndex: 4, endIndex: 5 });
    brushProps = wrapper.find(Brush).at(0).props();
    expect(brushProps.startIndex).to.equal(4);
    expect(brushProps.endIndex).to.equal(5);
  });

  it('should accept new startIndex and endIndex after initial render', () => {

    const wrapper = mount(chart());

		// make sure the right dots are shown
    verifyDots({ wrapper, numDots: 6, startIndex: 0, endIndex: 5 });

		// make sure the brush is in the right position
    let brushProps = wrapper.find(Brush).at(0).props();
    expect(brushProps.startIndex).to.equal(0);
    expect(brushProps.endIndex).to.equal(5);

    wrapper.setProps({ startIndex: 4, endIndex: 5 });

		// makek sure the right dots are shown
    verifyDots({ wrapper, numDots: 2, startIndex: 4, endIndex: 5 });
    brushProps = wrapper.find(Brush).at(0).props();
    expect(brushProps.startIndex).to.equal(4);
    expect(brushProps.endIndex).to.equal(5);
  });


});

describe('<LineChart /> - Pure Rendering', () => {
  const pureElements = [Line, XAxis, YAxis, Legend];

  const spies = [];

	// spy on each pure element before each test, and restore the spy afterwards
  beforeEach(() => {
    pureElements.forEach((el, i) => (spies[i] = sinon.spy(el.prototype, 'render')));
  });
  afterEach(() => {
    pureElements.forEach((el, i) => spies[i].restore());
  });

  const chart = (
    <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <Line isAnimationActive={false} type="monotone" dataKey="uv" stroke="#ff7300" />
      <Tooltip />
      <XAxis />
      <YAxis />
      <Brush />
      <Legend layout="vertical" />
    </LineChart>
	);

	// protect against the future where someone might mess up our clean rendering
  it('should only render Line once when the mouse enters and moves', () => {
    const wrapper = mount(chart);

    spies.forEach((el, i) => expect(el.callCount).to.equal(1, `${pureElements[i].name} Rendered more than once on initial load`));

    wrapper.simulate('mouseEnter', { pageX: 30, pageY: 200 });
    wrapper.simulate('mouseMove', { pageX: 200, pageY: 200 });
    wrapper.simulate('mouseLeave');

    spies.forEach((el, i) => expect(el.callCount).to.equal(1, `${pureElements[i].name} Rendered more than once after mouse over events`));
  });

	// protect against the future where someone might mess up our clean rendering
  it('should only render Line once when the brush moves but doesn\'t change start/end indices', () => {
    const wrapper = mount(chart);

    spies.forEach((el) => expect(el.callCount).to.equal(1, `${el.constructor.displayName} Rendered more than once on initial load`));
    wrapper.instance().handleBrushChange({ startIndex: 0, endIndex: data.length - 1 });
    spies.forEach((el) => expect(el.callCount).to.equal(1, `${el.constructor.displayName} Rendered more than once after noop brush change`));
  });

});

describe('<LineChart /> - <Brush /> overlayChart prop', () => {
  const margin = { top: 5, right: 5, bottom: 5, left: 5 },
    chartHeight = 400,
    chartWidth = 400,
    xAxisHeight = 30,
    yAxisWidth = 40,
    legendHeight = 20;


  const lineChart = (props) =>
    <LineChart width={chartWidth} height={chartHeight} data={data} margin={margin}>
      <Line isAnimationActive={false} type="monotone" dataKey="uv" stroke="#ff7300" />
			<XAxis height={xAxisHeight} />
			<YAxis width={yAxisWidth} />
			<Brush {...props} />
			<Legend height={legendHeight} />
    </LineChart>;

  it('should overlay the chart when overlayChart is true and default the width/height to that of the chart', () => {

    const wrapper = mount(lineChart({ overlayChart: true }));
    const brush = wrapper.find(Brush);
    expect(brush.length).to.equal(1);

		// verify the axis are placed properly
		//eslint-disable-next-line
    let x, y, left, right, top, bottom, height, width, axisType;

    wrapper.find(CartesianAxis).forEach((el) => {
      ({ x, y, height, width, axisType } = el.props());
      if (axisType === 'xAxis') {
        expect({ x, y, height, width }).
					to.eql({ x: 45, y: 345, height: 30, width: 350 });
      } else {
        expect({ x, y, height, width }).
					to.eql({ x: 5, y: 5, height: 340, width: 40 });
      }
    });

		// verify Brush position
    ({ x, y, height, width } = wrapper.find(Brush).at(0).props());
    expect({ x, y, height, width }).
			to.eql({ x: 45, y: 5, height: 340, width: 350 });

		// verify Line positioning (x,y are fuzzy and calculated relative to dots and axis
		// eslint-disable-next-line prefer-const
    ({ left, right, top, bottom, height, width } = wrapper.find(Line).at(0).props());
    expect({ left, right, top, bottom, height, width }).
				to.eql({ left: 45, right: 5, top: 5, bottom: 55, width: 350, height: 340 });

  });

  it('should not overlay the brush on the chart when overlayChart is not present/false', () => {

    const wrapper = mount(lineChart({ }));
    const brush = wrapper.find(Brush);
    expect(brush.length).to.equal(1);

		// verify the axis are placed properly
		//eslint-disable-next-line
		let x, y, left, right, top, bottom, height, width, axisType;
    wrapper.find(CartesianAxis).forEach((el) => {
      ({ x, y, height, width, axisType } = el.props());
      if (axisType === 'xAxis') {
        expect({ x, y, height, width }).
					to.eql({ x: 45, y: 305, height: 30, width: 350 });
      } else {
        expect({ x, y, height, width }).
					to.eql({ x: 5, y: 5, height: 300, width: 40 });
      }
    });

		// verify Brush position
    ({ x, y, height, width } = wrapper.find(Brush).at(0).props());
    expect({ x, y, height, width }).
			to.eql({ x: 45, y: 335, height: 40, width: 350 });

		// verify Line positioning (x,y are fuzzy and calculated relative to dots and axis
		// eslint-disable-next-line prefer-const
    ({ left, right, top, bottom, height, width } = wrapper.find(Line).at(0).props());
    expect({ left, right, top, bottom, height, width }).
				to.eql({ left: 45, right: 5, top: 5, bottom: 95, width: 350, height: 300 });
  });

});

describe('<LineChart /> - Cartesian Grid', () => {

  const lineChart =
	(<LineChart width={500} height={200} data={data}>
		<XAxis dataKey="name" orientation="bottom" height={20} />
		<CartesianGrid strokeDasharray="3 3" />
		<Line dataKey="pv" stroke="blue" isAnimationActive={false} />
		<Tooltip />
	</LineChart>);

  it('should display the right number of horizontal and vertical grid lines', () => {

    const wrapper = mount(lineChart);
    expect(wrapper.find('.recharts-cartesian-grid-horizontal line')).to.have.lengthOf(5);
    expect(wrapper.find('.recharts-cartesian-grid-vertical line')).to.have.lengthOf(6);
  });

});
