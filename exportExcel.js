import ExcelJS from "exceljs";

export function handleExport(tableData, tableHeader, options) {
  return exportExcel(tableData, tableHeader, options).then((excelBuffer) => {
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const downloadLink = document.createElement("a");
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.download = options.fileName;
    downloadLink.click();
  });
}

export function exportExcel(tableData, tableHeader, options) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(options.sheetName);

  // 检查是否有多级表头
  const hasMultiLevelHeader =
    Array.isArray(tableHeader) && tableHeader.some((header) => header.child);

  if (hasMultiLevelHeader) {
    // 设置多级表头
    setMultiLevelHeader(worksheet, tableHeader, options);
  } else {
    // 设置单级表头
    setSingleLevelHeader(worksheet, tableHeader, options);
  }

  //添加数据
  addTableData(worksheet, tableData, tableHeader);

  //设置每一列的宽度
  setMaxColumnWidths(worksheet.columns);

  return workbook.xlsx.writeBuffer();
}

//添加数据
function addTableData(worksheet, tableData, tableHeader) {
  // 设置数据并且添加样式
  tableData.forEach((row) => {
    const rowData = [];
    flattenRowData(row, rowData, tableHeader);
    const rowObj = worksheet.addRow(rowData);
    if (row.isSubtotal) {
      rowObj.eachCell((cell) => {
        // 检查单元格是否为空
        applyCellStyle(cell, {
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "D9D9D9" },
          }, // 表头背景色为d9d9d9
          font: { size: 12, bold: true }, // 表头字体为微软雅黑、大小为32、加粗
        });
      });
    }
    rowObj.eachCell((cell) => {
      applyCellStyle(cell, {
        alignment: { vertical: "middle", horizontal: "center" }, // 居中
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      });
    });
  });

/*   //给大标题增加样式
  const headerRow = worksheet.getCell("A1");
  applyCellStyle(headerRow, {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "D9D9D9" } }, // 表头背景色为d9d9d9
    font: { name: "微软雅黑", size: 32, bold: true }, // 表头字体为微软雅黑、大小为32、加粗
    alignment: { vertical: "middle", horizontal: "center" }, // 表头居中
  }); */

  // 获取头部信息
  const headerRow = worksheet.getRow(1);
  // 设置头部的样式
  headerRow.eachCell((cell) => {
    applyCellStyle(cell, {
      font: { bold: true },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
      alignment: { vertical: "middle", horizontal: "center" }, // 表头居中
    });
  });
}

//生成多级表头
function setMultiLevelHeader(worksheet, header, options) {
  const { requiredStyle } = options;
  const mergeCells = [];

  function setHeader(header, rowIndex, colIndex) {
    header.forEach((item, index) => {
      const startCell = worksheet.getCell(rowIndex, colIndex);
      startCell.value = item.name;
      if (item.required) {
        startCell.value = `*${item.name}`;
        const columnCells = worksheet.getColumn(index + 1);
        // 设置传worksheet.入的自定义样式
        columnCells.eachCell((cell) => {
          applyCellStyle(cell, requiredStyle);
        });
      }
      const colSpan = countLeaves(item);
      const rowSpan = countRows(header);
      const endCell = worksheet.getCell(
        rowIndex + rowSpan - 1,
        colIndex + colSpan - 1
      );
      // 设置边框
      applyCellStyle(startCell, {
        font: { size: 12, bold: true }, // 表头字体为微软雅黑、大小为32、加粗
        alignment: { vertical: "middle", horizontal: "center" }, // 表头居中
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "D9D9D9" },
        },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      });
      if (rowIndex === 2 && colIndex === 1) {
        worksheet.mergeCells(rowIndex, colIndex, rowIndex + 1, colIndex);
      }
      if (rowIndex === 2 && colIndex === 2) {
        worksheet.mergeCells(rowIndex, colIndex, rowIndex + 1, colIndex);
      }
      if (rowIndex === 2 && colIndex === 3) {
        worksheet.mergeCells(rowIndex, colIndex, rowIndex + 1, colIndex);
      }

      // 检查开始单元格和结束单元格是否已经合并
      if (!startCell.isMerged && !endCell.isMerged) {
        mergeCells.push({
          start: { row: rowIndex, column: colIndex },
          end: { row: rowIndex + rowSpan - 1, column: colIndex + colSpan - 1 },
        });
      }

      if (item.child) {
        setHeader(item.child, rowIndex + 1, colIndex);
      }
      colIndex += colSpan;
    });
  }

  setHeader(header, 1, 1);

  // 合并多级表头的单元格
  mergeCells.forEach((merge) => {
    const startCell = worksheet.getCell(merge.start.row, merge.start.column);
    const endCell = worksheet.getCell(merge.end.row, merge.end.column);

    // 检查开始单元格和结束单元格是否已经合并
    if (!startCell.isMerged && !endCell.isMerged) {
      worksheet.mergeCells(
        merge.start.row,
        merge.start.column,
        merge.end.row,
        merge.end.column
      );
    }
  });
}

// 计算子节点数量
function countLeaves(column) {
  if (column.child) {
    let leaves = 0;
    column.child.forEach((child) => {
      leaves += countLeaves(child);
    });
    return leaves;
  } else {
    return 1;
  }
}

// 计算纵向跨足的行数
function countRows(header) {
  let maxDepth = 1;

  function calculateDepth(header) {
    if (header.child) {
      let depth = 0;
      header.child.forEach((item) => {
        const itemDepth = calculateDepth(item);
        depth = Math.max(depth, itemDepth);
      });
      maxDepth += depth;
      return depth + 1;
    }
    return 1;
  }

  calculateDepth(header);
  return maxDepth;
}

// 设置单级表头
function setSingleLevelHeader(worksheet, header, options) {
  const { requiredStyle } = options;
  header.forEach((item, index) => {
    const cell = worksheet.getCell(1, index + 1);
    cell.value = item.label
    if (item.required) {
      cell.value = `*${item.label}`;
      const columnCells = worksheet.getColumn(index + 1);
      // 设置传入的自定义样式
      columnCells.eachCell((cell) => {
        applyCellStyle(cell, requiredStyle);
      });
    }
  });
}

// 将数据平铺
function flattenRowData(row, rowData, header) {
  header.forEach((item) => {
    if (item.child) {
      flattenRowData(row, rowData, item.child);
    } else {
      rowData.push(row[item.prop]);
    }
  });
}

// 定义设置最大列宽度的方法
function setMaxColumnWidths(columns) {
  columns.forEach((column) => {
    let widths = [];
    // 遍历列中的每个单元格
    column.eachCell({ includeEmpty: true }, (cell) => {
      if (
        cell.value !== null &&
        cell.value !== undefined &&
        cell.address.indexOf("1") === -1
      ) {
        const cellLength = getCellWidth(cell.value);
        widths.push(cellLength);
      }
    });
    column.width = Math.max(...widths);
  });
}
function getCellWidth(value) {
  // 判断是否为null或undefined
  if (value == null) {
    return 12;
  } else if (/.*[\u4e00-\u9fa5]+.*$/.test(value)) {
    // 中文的长度
    const chineseLength = value.match(/[\u4e00-\u9fa5]/g).length;
    // 其他不是中文的长度
    const otherLength = value.length - chineseLength;
    return chineseLength * 2.4 + otherLength * 1.2;
  } else {
    return value.toString().length * 1.2;
  }
}

//给行加样式
function applyRowStyle(row, style) {
  // 根据需要设置行的样式，例如设置字体、背景色、边框等
  if (style.font) {
    row.font = style.font;
  }
  if (style.fill) {
    row.fill = style.fill;
  }
  if (style.border) {
    row.border = style.border;
  }
}

//给单元格加样式
function applyCellStyle(cell, style) {
  if (style.font) {
    cell.font = style.font;
  }
  if (style.fill) {
    cell.fill = style.fill;
  }
  if (style.border) {
    cell.border = style.border;
  }
  if (style.alignment) {
    cell.alignment = style.alignment;
  }
}
