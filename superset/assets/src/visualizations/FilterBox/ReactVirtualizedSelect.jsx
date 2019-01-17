// /** @flow */
// import PropTypes from 'prop-types';
// import React, { Component } from 'react';
// import { Select } from 'react-select';
// import debounce from 'lodash.debounce';

// // Import directly to avoid Webpack bundling the parts of react-virtualized that we are not using
// import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
// import List from 'react-virtualized/dist/commonjs/List';
// import {
//   CellMeasurer,
//   CellMeasurerCache,
// } from 'react-virtualized/dist/commonjs/CellMeasurer';

// export default class VirtualizedSelect extends Component {

//   static propTypes = {
//     async: PropTypes.bool,
//     listProps: PropTypes.object,
//     maxHeight: PropTypes.number,
//     defaultOptionHeight: PropTypes.number,
//     optionRenderer: PropTypes.func,
//     selectComponent: PropTypes.func,
//   };

//   static defaultProps = {
//     async: false,
//     maxHeight: 200,
//     defaultOptionHeight: 35,
//   };

//   constructor(props, context) {
//     super(props, context);
//     this.state = {
//       listHeight: props.maxHeight,
//     };

//     this.cache = new CellMeasurerCache({
//       defaultHeight: props.defaultOptionHeight,
//       minHeight: props.defaultOptionHeight,
//       fixedWidth: true,
//     });

//     this.cellMeasureRefs = {};
//     this.renderMenu = this.renderMenu.bind(this);
//     this.optionRenderer = this.optionRenderer.bind(this);
//     this.setListRef = this.setListRef.bind(this);
//     this.setSelectRef = this.setSelectRef.bind(this);
//     this.setCellMeasureRef = this.setCellMeasureRef.bind(this);
//   }

//   getSelectComponent() {
//     const { async, selectComponent } = this.props;

//     if (selectComponent) {
//       return selectComponent;
//     } else if (async) {
//       return Select.Async;
//     }
//     return Select;
//   }

//   setListRef(ref) {
//     this.listRef = ref;
//   }

//   setSelectRef(ref) {
//     this.selectRef = ref;
//   }

//   setCellMeasureRef(key, ref) {
//     this.cellMeasureRefs[key] = ref;
//   }

//   optionRenderer({
//     focusedOption,
//     focusOption,
//     key,
//     labelKey,
//     option,
//     optionIndex,
//     selectValue,
//     style,
//     valueArray,
//     parent,
//   }) {
//     const className = ['VirtualizedSelectOption'];

//     if (option === focusedOption) {
//       className.push('VirtualizedSelectFocusedOption');
//     }

//     if (option.disabled) {
//       className.push('VirtualizedSelectDisabledOption');
//     }

//     if (valueArray && valueArray.indexOf(option) >= 0) {
//       className.push('VirtualizedSelectSelectedOption');
//     }

//     if (option.className) {
//       className.push(option.className);
//     }

//     const events = option.disabled
//       ? {}
//       : {
//           onClick: () => selectValue(option),
//           onMouseEnter: () => focusOption(option)
//         };

//     return (
//       <CellMeasurer
//         cache={this.cache}
//         columnIndex={0}
//         key={key}
//         parent={parent}
//         rowIndex={optionIndex}
//         ref={ref => this.setCellMeasureRef(key, ref)}
//       >
//         <div
//           className={className.join(' ')}
//           key={key}
//           style={style}
//           title={option.title}
//           {...events}
//         >
//           {option[labelKey]}
//         </div>
//       </CellMeasurer>
//     );
//   }

//   calculateListHeight(numRows) {
//     const { maxHeight, defaultOptionHeight } = this.props;

//     let height = 0;
//     for (let index = 0; index < numRows; index++) {
//       height += this.cache.getHeight(index);
//       if (height > maxHeight) {
//         return maxHeight;
//       }
//     }

//     if (!height) return defaultOptionHeight;
//     return height;
//   }

//   /** See Select#focus (in react-select) */
//   focus() {
//     if (this.selectRef) {
//       return this.selectRef.focus();
//     }
//   }

//   remeasure = debounce(() => {
//     this.cache.clearAll();
//     if (this.listRef) {
//       this.listRef.recomputeRowHeights();
//     }

//     if (this.cellMeasureRefs) {
//       Object.keys(this.cellMeasureRefs).forEach((key) => {
//         if (this.cellMeasureRefs[key]) {
//           this.cellMeasureRefs[key].maybeMeasureCell();
//         }
//       });
//     }

//     this.setState({
//       listHeight: this.calculateListHeight(this.cache.rowCount),
//     });
//   }, 50);

//   /** See List#recomputeRowHeights */
//   recomputeOptionHeights(index = 0) {
//     if (this.listRef) {
//       this.listRef.recomputeRowHeights(index);
//     }
//   }

//   // See https://github.com/JedWatson/react-select/#effeciently-rendering-large-lists-with-windowing
//   renderMenu({
//     focusedOption,
//     focusOption,
//     labelKey,
//     onSelect,
//     options,
//     selectValue,
//     valueArray,
//     valueKey,
//   }) {
//     const { listProps, optionRenderer } = this.props;
//     const focusedOptionIndex = options.indexOf(focusedOption);
//     const height = this.calculateListHeight(options.length);
//     const innerRowRenderer = optionRenderer || this.optionRenderer;

//     // react-select 1.0.0-rc2 passes duplicate `onSelect` and `selectValue` props to `menuRenderer`
//     // The `Creatable` HOC only overrides `onSelect` which breaks an edge-case
//     // In order to support creating items via clicking on the placeholder option,
//     // We need to ensure that the specified `onSelect` handle is the one we use.
//     // See issue #33

//     function wrappedRowRenderer({ index, key, style, parent }) {
//       const option = options[index];

//       return innerRowRenderer({
//         focusedOption,
//         focusedOptionIndex,
//         focusOption,
//         key,
//         labelKey,
//         onSelect,
//         option,
//         optionIndex: index,
//         options,
//         selectValue: onSelect,
//         style,
//         valueArray,
//         valueKey,
//         parent,
//       });
//     }

//     return (
//       <AutoSizer disableHeight>
//         {({ width }) => (
//           <List
//             className="VirtualSelectGrid"
//             height={this.state.listHeight}
//             ref={this.setListRef}
//             rowCount={options.length}
//             rowHeight={this.cache.rowHeight}
//             rowRenderer={wrappedRowRenderer}
//             scrollToIndex={focusedOptionIndex}
//             width={width}
//             deferredMeasurementCache={this.cache}
//             {...listProps}
//           />
//         )}
//       </AutoSizer>
//     );
//   }

//   render() {
//     const SelectComponent = this.getSelectComponent();

//     return (
//       <SelectComponent
//         {...this.props}
//         ref={this.setSelectRef}
//         menuRenderer={this.renderMenu}
//         menuStyle={{ overflow: 'hidden' }}
//         onOpen={this.remeasure}
//         onInputChange={this.remeasure}
//       />
//     );
//   }
// }
