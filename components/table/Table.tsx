import React, { Component } from 'react';
import classnames from 'classnames';
import Loading from '../loading';
import Checkbox from '../checkbox';
import Popover from '../popover';
import domUtil from '../utils/dom';
import rAF from '../utils/rAF';
import PropsType from './PropsType';

class Table extends Component<PropsType, any> {
  static defaultProps = {
    prefixCls: 'ui-table',
    size: 'md',
    isBordered: false,
    isStriped: false,
    isRadius: false,
    isHover: false,
    maxCellSize: 20,
    columns: [],
    dataSource: [],
  };

  private fixedleftTbody;
  private fixedrightTbody;
  private scrollTbody;
  private fixedleftCol;
  private fixedrightCol;
  private scrollTable;
  private thead;
  private trow;
  private leftCell;
  private rightCell;

  constructor(props) {
    super(props);
    const selectedRows =
      'rowSelection' in props
        ? props.rowSelection.value || props.rowSelection.defaultValue || []
        : [];
    this.state = {
      selectedRows,
      sort: {},
      fixedColAttrs: {},
    };
  }

  componentDidMount() {
    rAF.rAF(() => this.getFixedColAttrs());
  }

  componentWillReceiveProps(nextProps) {
    if ('rowSelection' in nextProps && 'value' in nextProps.rowSelection) {
      this.setState({
        selectedRows: nextProps.rowSelection.value,
      });
    }
    if (nextProps.dataSource !== this.props.dataSource) {
      // 数据变更重新计算固定列高度
      rAF.rAF(() => this.getFixedColAttrs());
    }
  }

  onSort(column) {
    const { dataSource } = this.props;
    const sort = !this.state.sort[column.dataIndex];

    sort ? dataSource.sort(column.sorter) : dataSource.reverse();

    this.setState({
      sort: {
        [`${column.dataIndex}`]: sort,
      },
    });
  }

  onEnterTableRow(index) {
    const { fixedleftTbody, fixedrightTbody, scrollTbody } = this;

    [fixedleftTbody, fixedrightTbody, scrollTbody].forEach((tbody) => {
      if (tbody) {
        this.toggleHoverStatus(tbody.querySelectorAll('tr'), index);
      }
    });
  }

  onLeaveTableRow() {
    this.onEnterTableRow(-1);
  }

  onScrollTable = (e) => {
    const { target } = e;
    const { fixedleftCol, fixedrightCol, scrollTable } = this;
    const containerWidth = parseInt(
      domUtil.getStyleComputedProperty(target, 'width'),
      10,
    );
    const scrollTableWidth = parseInt(
      domUtil.getStyleComputedProperty(scrollTable, 'width'),
      10,
    );
    const { scrollLeft } = target;

    if (containerWidth < scrollTableWidth) {
      if (fixedleftCol) {
        if (scrollLeft > 0) {
          fixedleftCol.classList.add('shadow');
        } else {
          fixedleftCol.classList.remove('shadow');
        }
      }
      if (fixedrightCol) {
        if (scrollLeft + containerWidth < scrollTableWidth) {
          fixedrightCol.classList.add('shadow');
        } else {
          fixedrightCol.classList.remove('shadow');
        }
      }
    }
  }

  // 同步单元格宽度和高度
  getFixedColAttrs() {
    const { columns } = this.props;

    if (!columns || columns.length < 2) {
      return;
    }

    const firstColumn = columns[0];
    const lastColumn = columns[columns.length - 1];
    const {
      thead, trow, leftCell, rightCell,
    } = this;

    if (firstColumn.fixed || lastColumn.fixed) {
      const fixedColThHeight = domUtil.getStyleComputedProperty(
        thead,
        'height',
      );
      const fixedleftColWidth = domUtil.getStyleComputedProperty(
        leftCell,
        'width',
      );
      const fixedrightColWidth = domUtil.getStyleComputedProperty(
        rightCell,
        'width',
      );
      let fixedColTdHeight = '40';
      if (trow) {
        fixedColTdHeight = domUtil.getStyleComputedProperty(trow, 'height');
      }

      this.setState({
        fixedColAttrs: {
          fixedColThHeight,
          fixedColTdHeight,
          fixedleftColWidth,
          fixedrightColWidth,
        },
      });
    }
  }

  groupColumns(
    columns,
    currentRow = 0,
    parentColumn: { colSpan?: number } = {},
    rows: any[] = [],
    dataColumns: any[] = [],
  ) {
    rows[currentRow] = rows[currentRow] || [];
    const group: any[] = [];

    function setRowSpan(column) {
      const rowSpan = rows.length - currentRow;
      if (
        column &&
        !column.children &&
        rowSpan > 1 &&
        (!column.rowSpan || column.rowSpan < rowSpan)
      ) {
        column.rowSpan = rowSpan;
      }
    }
    columns.forEach((column, index) => {
      const newColumn = { ...column };
      rows[currentRow].push(newColumn);
      parentColumn.colSpan = parentColumn.colSpan || 0;
      if (newColumn.children && newColumn.children.length > 0) {
        newColumn.children = this.groupColumns(
          newColumn.children,
          currentRow + 1,
          newColumn,
          rows,
          dataColumns,
        ).group;
        parentColumn.colSpan += newColumn.colSpan;
      } else {
        dataColumns.push(newColumn);
        parentColumn.colSpan++;
      }

      for (let i = 0; i < rows[currentRow].length - 1; ++i) {
        setRowSpan(rows[currentRow][i]);
      }
      if (index + 1 === columns.length) {
        setRowSpan(newColumn);
      }
      group.push(newColumn);
    });
    return { group, headRows: rows, dataColumns };
  }

  // eslint-disable-next-line
  toggleHoverStatus(trs, index) {
    trs.forEach(tr => tr.classList.remove('hover'));
    if (index >= 0) {
      trs[index].classList.add('hover');
    }
  }

  renderTable() {
    const {
      columns,
      dataSource,
      rowClick,
      rowSelection,
      style,
      width,
      prefixCls,
    } = this.props;
    const { headRows, dataColumns } = this.groupColumns(columns);
    const cls = classnames({
      [`${prefixCls}-scroll`]: true,
      [`${prefixCls}-multi-headrow`]: headRows.length > 1,
    });

    return (
      <table
        className={cls}
        style={{ ...style, width }}
        ref={(scrollTable) => { this.scrollTable = scrollTable; }}
      >
        <thead
          ref={(thead) => { this.thead = thead; }}
        >
          {
            // tslint:disable-next-line:jsx-no-multiline-js
            headRows.map((row, index) => {
            // eslint-disable-line
            return (
              // eslint-disable-next-line
              <tr key={index}>
                {
                  // tslint:disable-next-line:jsx-no-multiline-js
                  rowSelection && index === 0
                  ? this.renderSelectAll(
                      rowSelection,
                      dataSource,
                      headRows.length,
                    )
                  : null}
                {
                  // tslint:disable-next-line:jsx-no-multiline-js
                  row.map((column, columnIndex) =>
                  this.renderColumn(column, columnIndex, index, row.length))}
              </tr>
            );
          })}
        </thead>
        <tbody
          ref={(scrollTbody) => { this.scrollTbody = scrollTbody; }}
        >
          {
            // tslint:disable-next-line:jsx-no-multiline-js
            dataSource.map((row, rowIndex) => {
            const renderSelect = rowSelection
              ? this.renderSelect(rowSelection, row)
              : null;
            // eslint-disable-next-line
            const renderCell = dataColumns.map((column, columnIndex) => {
              return this.renderCell(column, row, rowIndex, columnIndex);
            });

            const refAttr =
              rowIndex === 0
                ? {
                    ref: (trow) => {
                      this.trow = trow;
                    },
                  }
                : {};

            return (
              <tr
                // eslint-disable-next-line
                key={rowIndex}
                {...refAttr}
                onMouseEnter={() => this.onEnterTableRow(rowIndex)}
                onMouseLeave={() => this.onLeaveTableRow()}
                onClick={() => typeof rowClick === 'function' && rowClick(row)}
              >
                {renderSelect}
                {renderCell}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  // 渲染固定左侧的选择列
  renderFixedLeftCol() {
    const { dataSource, rowSelection, prefixCls } = this.props;
    const {
      fixedColAttrs: { fixedColThHeight, fixedColTdHeight },
    } = this.state;
    const cls = `${prefixCls}-fixed-left`;

    if (rowSelection && rowSelection.fixed) {
      return (
        <table
          ref={(fixedCol) => { this.fixedleftCol = fixedCol; }}
          className={cls}
        >
          <thead>
            <tr>
              {
                // tslint:disable-next-line:jsx-no-multiline-js
                rowSelection
                ? this.renderSelectAll(
                    rowSelection,
                    dataSource,
                    1,
                    fixedColThHeight,
                  )
                : null}
            </tr>
          </thead>
          <tbody
            ref={(fixedTbody) => { this.fixedleftTbody = fixedTbody; }}
          >
            {
              // tslint:disable-next-line:jsx-no-multiline-js
              dataSource.map((data, index) => {
              return (
                <tr
                  // eslint-disable-next-line
                  key={index}
                  onMouseEnter={() => this.onEnterTableRow(index)}
                  onMouseLeave={() => this.onLeaveTableRow()}
                >
                  {
                    // tslint:disable-next-line:jsx-no-multiline-js
                    rowSelection
                    ? this.renderSelect(rowSelection, data, fixedColTdHeight)
                    : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    return this.renderFixedTable('left');
  }

  // 渲染固定右侧的操作列
  renderFixedRightCol() {
    return this.renderFixedTable('right');
  }

  // 渲染固定位置的表格
  renderFixedTable(direction) {
    const { columns, dataSource, prefixCls } = this.props;
    const {
      fixedColAttrs: {
        fixedColThHeight, fixedColTdHeight, fixedleftColWidth, fixedrightColWidth,
      },
    } = this.state;
    const column = direction === 'left' ? columns[0] : columns[columns.length - 1];
    const columnWidth = direction === 'left' ? fixedleftColWidth : fixedrightColWidth;
    const {
      fixed, title, render, dataIndex,
    } = column;
    const cls = `${prefixCls}-fixed-${direction}`;

    if (fixed && fixed === direction) {
      return (
        <table
          ref={(fixedCol) => { this[`fixed${direction}Col`] = fixedCol; }}
          className={cls}
        >
          <thead>
            <tr>
              <th style={{ width: columnWidth, height: fixedColThHeight }}>{title}</th>
            </tr>
          </thead>
          <tbody
            ref={(fixedTbody) => { this[`fixed${direction}Tbody`] = fixedTbody; }}
          >
            {
              // tslint:disable-next-line:jsx-no-multiline-js
              dataSource.map((data, index) => {
              return (
                <tr
                  // eslint-disable-next-line
                  key={index}
                  onMouseEnter={() => this.onEnterTableRow(index)}
                  onMouseLeave={() => this.onLeaveTableRow()}
                >
                  <td style={{ height: fixedColTdHeight }}>
                    {
                      // tslint:disable-next-line:jsx-no-multiline-js
                      typeof render === 'function'
                      ? render(data[dataIndex], data, index)
                      : data[dataIndex]
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    return null;
  }

  // 全选所有行
  renderSelectAll(rowSelection, dataSource, rowSpan, height = 50) {
    return (
      <th
        style={{ minWidth: 50, height, textAlign: 'center' }}
        rowSpan={rowSpan}
      >
        <Checkbox
          checked={this.state.selectedRows.length === dataSource.length}
          // tslint:disable-next-line:jsx-no-multiline-js
          onChange={(e) => {
            const selected = e.target.checked;
            const selectedRows = selected ? dataSource.map(data => data) : [];

            this.setState({ selectedRows });
            if (rowSelection.onSelectAll) {
              rowSelection.onSelectAll(selected, selectedRows);
            }
          }}
        />
      </th>
    );
  }

  // 单选指定行
  renderSelect(rowSelection, row, height = 40) {
    return (
      <td style={{ width: 50, height, textAlign: 'center' }}>
        <Checkbox
          value={row}
          checked={this.state.selectedRows.indexOf(row) > -1}
          // tslint:disable-next-line:jsx-no-multiline-js
          onChange={(e) => {
            const selected = e.target.checked;
            const { selectedRows } = this.state;

            if (selectedRows.indexOf(row) === -1) {
              selectedRows.push(row);
            } else {
              selectedRows.splice(selectedRows.indexOf(row), 1);
            }
            this.setState({ selectedRows });
            if (rowSelection.onSelect) {
              rowSelection.onSelect(selected, row, selectedRows);
            }
          }}
        />
      </td>
    );
  }

  // 表头渲染
  renderColumn(column, index, rowIndex, length) {
    const render =
      'columnRender' in column
        ? column.columnRender(column, index)
        : column.title;

    const {
      dataIndex, width, rowSpan, colSpan, style = {},
    } = column;

    let refAttr = {};
    if (rowIndex === 0) {
      if (index === 0) {
        refAttr = {
          ref: (leftCell) => { this.leftCell = leftCell; },
        };
      } else if (index === length - 1) {
        refAttr = {
          ref: (rightCell) => { this.rightCell = rightCell; },
        };
      }
    }
    return (
      <th
        key={dataIndex + index}
        rowSpan={rowSpan}
        colSpan={colSpan}
        style={{ ...style, width }}
        {...refAttr}
      >
        {render}
        {this.renderSorter(column)}
      </th>
    );
  }

  // 排序渲染
  renderSorter(column) {
    const { prefixCls } = this.props;
    const sort = this.state.sort[column.dataIndex];
    const sortUpCls = classnames({
      [`${prefixCls}-sorter-up`]: true,
      [`${prefixCls}-sorter-active`]: !!sort,
    });
    const sortDownCls = classnames({
      [`${prefixCls}-sorter-down`]: true,
      [`${prefixCls}-sorter-active`]: sort !== undefined && !sort,
    });

    return column.sorter ? (
      <span className={`${prefixCls}-sorter`} onClick={() => this.onSort(column)}>
        <span className={sortUpCls} />
        <span className={sortDownCls} />
      </span>
    ) : null;
  }

  // 单元格渲染
  renderCell(column, row, rowIndex, columnIndex) {
    const { maxCellSize } = this.props;
    const value = row[column.dataIndex];
    const { style = {} } = column;
    const render =
      'render' in column ? column.render(value, row, rowIndex) : value;

    // 渲染需合并的单元格
    if (
      typeof render === 'object' &&
      render !== null &&
      ('colSpan' in render || 'rowSpan' in render)
    ) {
      return this.renderMergedCell(column, columnIndex, render);
    }
    // 字符长度判断
    if (typeof render === 'string' && render.length > maxCellSize) {
      return (
        <td key={column.dataIndex + columnIndex} style={style}>
          <Popover trigger="hover" direction="top" content={render}>
            <div className="ellipsis-cell" style={{ maxWidth: 15 * maxCellSize }}>{render}</div>
          </Popover>
        </td>
      );
    }
    return <td key={column.dataIndex + columnIndex} style={style}>{render}</td>;
  }

  // 合并单元格
  // eslint-disable-next-line
  renderMergedCell(column, columnIndex, render) {
    const { maxCellSize } = this.props;
    const { colSpan, rowSpan, value } = render;
    const { style = {} } = column;
    if (colSpan === 0 || rowSpan === 0) {
      return null;
    }
    // 字符长度判断
    if (typeof value === 'string' && value.length > maxCellSize) {
      return (
        <td
          key={column.dataIndex + columnIndex}
          style={style}
          colSpan={colSpan}
          rowSpan={rowSpan}
        >
          <Popover trigger="hover" direction="top" content={value}>
            <div className="ellipsis-cell" style={{ maxWidth: 15 * maxCellSize }}>{value}</div>
          </Popover>
        </td>
      );
    }
    return (
      <td
        style={style}
        key={column.dataIndex + columnIndex}
        colSpan={colSpan}
        rowSpan={rowSpan}
      >
        {value}
      </td>
    );
  }

  render() {
    const { props } = this;
    const {
      isBordered,
      isStriped,
      isRadius,
      isHover,
      isLoading,
      size,
      className,
      prefixCls,
    } = props;

    const cls = classnames({
      [prefixCls!]: true,
      [`${prefixCls}-bordered`]: 'bordered' in props || isBordered,
      [`${prefixCls}-striped`]: 'striped' in props || isStriped,
      [`${prefixCls}-radius`]: 'radius' in props || isRadius,
      [`${prefixCls}-hover`]: 'hover' in props || isHover,
      [`size-${size}`]: !!size,
      [className!]: !!className,
    });

    const content = isLoading ? (
      <Loading visible>{this.renderTable()}</Loading>
    ) : (
      this.renderTable()
    );
    const fixedleftCol = this.renderFixedLeftCol();
    const fixedrightCol = this.renderFixedRightCol();

    return (
      <div className={cls}>
        <div className={`${prefixCls}-body`} onScroll={this.onScrollTable}>
          {content}
          {fixedleftCol}
          {fixedrightCol}
        </div>
      </div>
    );
  }
}

export default Table;
