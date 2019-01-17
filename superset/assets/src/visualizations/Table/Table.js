import d3 from 'd3';
import $ from 'jquery';
import PropTypes from 'prop-types';
import dt from 'datatables.net-bs';
import 'datatables.net-bs/css/dataTables.bootstrap.css';
import dompurify from 'dompurify';
import { fixDataTableBodyHeight, d3TimeFormatPreset } from '../../modules/utils';
import './Table.css';
import { format as d3Format } from 'd3-format';
import { getNumberFormatterRegistry, formatNumber, NumberFormatter } from '@superset-ui/number-format';

dt(window, $);

const propTypes = {
  // Each object is { field1: value1, field2: value2 }
  data: PropTypes.arrayOf(PropTypes.object),
  height: PropTypes.number,
  alignPositiveNegative: PropTypes.bool,
  colorPositiveNegative: PropTypes.bool,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string,
    format: PropTypes.string,
  })),
  filters: PropTypes.object,
  includeSearch: PropTypes.bool,
  metrics: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ])),
  onAddFilter: PropTypes.func,
  onRemoveFilter: PropTypes.func,
  orderDesc: PropTypes.bool,
  pageLength: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]),
  percentMetrics: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ])),
  tableFilter: PropTypes.bool,
  tableTimestampFormat: PropTypes.string,
  timeseriesLimitMetric: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),
};

const formatValue = d3.format('0,000');
const formatPercent = d3.format('.3p');

getNumberFormatterRegistry().registerValue('my_format', new NumberFormatter({
  id: 'my_format',
  formatFunc: v => `ر.س ${v}`,
}));

function NOOP() {}

function TableVis(element, props) {
  const {
    data,
    height,
    alignPositiveNegative = false,
    colorPositiveNegative = false,
    columns,
    filters = {},
    includeSearch = false,
    metrics: rawMetrics,
    onAddFilter = NOOP,
    onRemoveFilter = NOOP,
    orderDesc,
    pageLength,
    percentMetrics,
    tableFilter,
    tableTimestampFormat,
    timeseriesLimitMetric,
  } = props;

  const $container = $(element);

  const metrics = (rawMetrics || []).map(m => m.label || m)
    // Add percent metrics
    .concat((percentMetrics || []).map(m => '%' + m))
    // Removing metrics (aggregates) that are strings
    .filter(m => (typeof data[0][m]) === 'number');

  function col(c) {
    const arr = [];
    for (let i = 0; i < data.length; i += 1) {
      arr.push(data[i][c]);
    }
    return arr;
  }
  const maxes = {};
  const mins = {};
  for (let i = 0; i < metrics.length; i += 1) {
    if (alignPositiveNegative) {
      maxes[metrics[i]] = d3.max(col(metrics[i]).map(Math.abs));
    } else {
      maxes[metrics[i]] = d3.max(col(metrics[i]));
      mins[metrics[i]] = d3.min(col(metrics[i]));
    }
  }

  const tsFormatter = d3TimeFormatPreset(tableTimestampFormat);

  const div = d3.select(element);
  div.html('');
  const table = div.append('table')
    .classed(
      'dataframe dataframe table table-striped ' +
      'table-condensed table-hover dataTable no-footer', true)
    .attr('width', '100%');

  table.append('thead').append('tr')
    .selectAll('th')
    .data(columns.map(c => c.label))
    .enter()
    .append('th')
    .text(d => d);

  table.append('tbody')
    .selectAll('tr')
    .data(data)
    .enter()
    .append('tr')
    .selectAll('td')
    .data(row => columns.map(({ key, format }) => {
      const val = row[key];
      let html;
      const isMetric = metrics.indexOf(key) >= 0;
      if (key === '__timestamp') {
        html = tsFormatter(val);
      }
      if (typeof (val) === 'string') {
        html = `<span class="like-pre">${dompurify.sanitize(val)}</span>`;
      }
      if (isMetric) {
        // d3.json('https://unpkg.com/d3-format@1/locale/ru-RU.json', function (error, locale) {
        //   if (error) throw error;
        //   console.log('locale : ' + JSON.stringify(locale));

        //   var jk = d3.formatLocale(JSON.stringify(locale));
        //   var sa = jk.numberFormat("$,.2f");
        
        //   console.log('vvbnvbn : ' + sa(332));
        //   var format = d3.format("$,");
        //   console.log(format(1234.56)); // 1 234,56 руб.
        // });
        var NL = d3.locale ({
          "decimal": ".",
          "thousands": ",",
          "grouping": [3],
          "currency": ["ر.س", ""],
          "dateTime": "%a %b %e %X %Y",
          "date": "%m/%d/%Y",
          "time": "%H:%M:%S",
          "periods": ["AM", "PM"],
          "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
          "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        });
        
        var eur = NL.numberFormat("$.2f");
        
        console.log('sdfsdfsdf : ' + eur(val));
        console.log('formatNumber : ' + formatNumber('my_format', val));
        // d3.json('https://unpkg.com/d3-format@1/locale/de-DE.json', function (locale) {
        //   d3.locale(locale);
        //   var format = d3.format("$,.2f");
        //   console.log(format(1289.56));
        // });
        html = d3.format(format || '0.3s')(val);
        html = 'ر.س ' + html;
      }
      if (key[0] === '%') {
        html = formatPercent(val);
      }

      return {
        col: key,
        val,
        html,
        isMetric,
      };
    }))
    .enter()
    .append('td')
    .style('background-image', function (d) {
      if (d.isMetric) {
        const r = (colorPositiveNegative && d.val < 0) ? 150 : 31;
        if (alignPositiveNegative) {
          const perc = Math.abs(Math.round((d.val / maxes[d.col]) * 100));
          // The 0.01 to 0.001 is a workaround for what appears to be a
          // CSS rendering bug on flat, transparent colors
          return (
            `linear-gradient(to right, rgba(${r},119, 180,1.2), rgba(${r},119, 180,0.2) ${perc}%, ` +
            `rgba(0,119, 180,0.01) ${perc}%, rgba(0,0,0,0.001) 100%)`
          );
        }
        const posExtent = Math.abs(Math.max(maxes[d.col], 0));
        const negExtent = Math.abs(Math.min(mins[d.col], 0));
        const tot = posExtent + negExtent;
        const perc1 = Math.round((Math.min(negExtent + d.val, negExtent) / tot) * 100);
        const perc2 = Math.round((Math.abs(d.val) / tot) * 100);
        // The 0.01 to 0.001 is a workaround for what appears to be a
        // CSS rendering bug on flat, transparent colors
        return (
          `linear-gradient(to right, rgba(31, 119, 180,0.01), rgba(31, 119, 180,0.001) ${perc1}%, ` +
          `rgba(${r},119, 180,1.2) ${perc1}%, rgba(${r},119, 180,0.2) ${perc1 + perc2}%, ` +
          `rgba(31, 119, 180,0.01) ${perc1 + perc2}%, rgba(0,0,0,0.001) 100%)`
        );
      }
      return null;
    })
    .classed('text-right', d => d.isMetric)
    .attr('title', d => (!Number.isNaN(d.val) ? formatValue(d.val) : null))
    .attr('data-sort', d => (d.isMetric) ? d.val : null)
    // Check if the dashboard currently has a filter for each row
    .classed('filtered', d =>
      filters &&
      filters[d.col] &&
      filters[d.col].indexOf(d.val) >= 0,
    )
    .on('click', function (d) {
      if (!d.isMetric && tableFilter) {
        const td = d3.select(this);
        if (td.classed('filtered')) {
          onRemoveFilter(d.col, [d.val]);
          d3.select(this).classed('filtered', false);
        } else {
          d3.select(this).classed('filtered', true);
          onAddFilter(d.col, [d.val]);
        }
      }
    })
    .style('cursor', d => (!d.isMetric) ? 'auto' : '')
    .html(d => d.html ? d.html : d.val);

  const paging = pageLength && pageLength > 0;

  const datatable = $container.find('.dataTable').DataTable({
    paging,
    pageLength,
    aaSorting: [],
    searching: includeSearch,
    bInfo: false,
    scrollY: `${height}px`,
    scrollCollapse: true,
    scrollX: true,
  });

  fixDataTableBodyHeight($container.find('.dataTables_wrapper'), height);
  // Sorting table by main column
  let sortBy;
  const limitMetric = Array.isArray(timeseriesLimitMetric)
    ? timeseriesLimitMetric[0]
    : timeseriesLimitMetric;
  if (limitMetric) {
    // Sort by as specified
    sortBy = limitMetric.label || limitMetric;
  } else if (metrics.length > 0) {
    // If not specified, use the first metric from the list
    sortBy = metrics[0];
  }
  if (sortBy) {
    const keys = columns.map(c => c.key);
    const index = keys.indexOf(sortBy);
    datatable.column(index).order(orderDesc ? 'desc' : 'asc');
    if (metrics.indexOf(sortBy) < 0) {
      // Hiding the sortBy column if not in the metrics list
      datatable.column(index).visible(false);
    }
  }
  datatable.draw();
}

TableVis.displayName = 'TableVis';
TableVis.propTypes = propTypes;

export default TableVis;
