import ExcelJS from 'exceljs';
export const generateExamSubmissionsXlsx = async (examTitle, rows) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('نتائج الاختبار');
    // Enable right-to-left layout for Arabic compatibility
    worksheet.views = [{ rightToLeft: true }];
    // 1. Brand Title Banner
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `تقرير نتائج اختبار: ${examTitle}`;
    titleCell.font = { name: 'Cairo', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEE7C11' }, // Orange brand color
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;
    // 2. Define Headers
    const headers = [
        { header: 'اسم الطالب', key: 'studentName', width: 25 },
        { header: 'البريد الإلكتروني', key: 'studentEmail', width: 30 },
        { header: 'رقم المحاولة', key: 'attempt', width: 15 },
        { header: 'الدرجة المحرزة', key: 'score', width: 15 },
        { header: 'الدرجة الكلية', key: 'totalPoints', width: 15 },
        { header: 'الحالة', key: 'status', width: 15 },
        { header: 'تاريخ التسليم', key: 'submittedAt', width: 25 },
    ];
    worksheet.columns = headers;
    // 3. Style Headers Row
    const headerRow = worksheet.getRow(2);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
        cell.font = { name: 'Cairo', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F172A' }, // Navy blue color
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });
    // 4. Populate Data Rows
    rows.forEach((row) => {
        const dataRow = worksheet.addRow({
            studentName: row.studentName,
            studentEmail: row.studentEmail,
            attempt: row.attempt,
            score: row.score,
            totalPoints: row.totalPoints,
            status: row.status,
            submittedAt: row.submittedAt,
        });
        dataRow.height = 22;
        dataRow.eachCell((cell, colNumber) => {
            cell.font = { name: 'Cairo', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            // Dynamic text colors for statuses
            if (colNumber === 6) { // 'الحالة' (Status) Column
                const val = String(cell.value);
                if (val === 'ناجح' || val === 'Passed') {
                    cell.font = { name: 'Cairo', size: 10, bold: true, color: { argb: 'FF10B981' } }; // Emerald Green
                }
                else if (val === 'راسب' || val === 'Failed') {
                    cell.font = { name: 'Cairo', size: 10, bold: true, color: { argb: 'FFEF4444' } }; // Rose Red
                }
            }
        });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};
//# sourceMappingURL=excelGenerator.js.map