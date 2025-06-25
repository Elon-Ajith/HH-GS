const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');
const path = require('path')

const streamToBuffer = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
};

exports.generatePDFBase64 = async (data) => {
    try {
        const doc = new PDFDocument();
        const stream = new PassThrough();
        doc.pipe(stream);

        function addWatermark(doc, text = "HIKE HEALTH GS") {
            doc.save()
                .fillColor('gray')
                .fontSize(35)
                .font('Times-Bold')
                .opacity(0.1)
                .translate(doc.page.width / 2, doc.page.height / 2)
                .rotate(-45)
                .text(text, -doc.widthOfString(text) / 2, 0, { lineBreak: false });
            doc.restore();
        }

        // Add watermark after each page is created
        doc.on('pageAdded', () => {
            addWatermark(doc);
            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
                .lineWidth(1)
                .strokeColor('#000')
                .stroke();
        });

        // Border on first page
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
            .lineWidth(1)
            .strokeColor('#000')
            .stroke();

        // Write content
        doc.save(); // Save before writing content
        doc.image(path.join(__dirname, '../Assets/Hike Icon.png'), 90, 27, { width: 30 })
        doc.fillColor('blue').fontSize(21).font('Times-Bold').text('HIKE HEALTH GS PRIVATE LIMITED', 132, 39);
        doc.strokeColor('black').lineWidth(1).moveTo(20, 78).lineTo(592, 78).stroke();
        doc.font('Times-Bold').fontSize(18).fillColor('black').text('Employees Attendance Report', 200,100);
        const headers = ['S.No', 'Employee ID', 'Name', 'Working Hours'];
        const rows = data.map((emp, index) => [
            (index + 1).toString(),
            emp.empId,
            toTitleCase(emp.empName),
            formatToHourMinute(emp.totalWorkingHours)
        ]);
        const columnWidths = [50, 120, 200, 130]; // You can adjust

        drawTable(doc, 50, 130, headers, rows, columnWidths);
        doc.restore(); // Restore after content

        // Watermark last to avoid side effects
        addWatermark(doc);

        doc.end();

        const buffer = await streamToBuffer(stream);
        return buffer.toString('base64');

    } catch (err) {
        console.error(err);
        throw new Error("Error generating PDF: " + err.message);
    }
};

const toTitleCase = (str) => {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function formatToHourMinute(timeStr) {
    const [hh, mm] = timeStr.split(':');
    return `${parseInt(hh)} hrs ${parseInt(mm)} min`;
}

function drawTable(doc, startX, startY, headers, rows, columnWidths) {
    const rowHeight = 21;
    let y = startY;
    doc.strokeColor('gray');
    // Draw header
    doc.fontSize(12).font('Helvetica-Bold').fillColor('black');
    headers.forEach((text, i) => {
        const x = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, y, columnWidths[i], rowHeight).stroke();
        doc.text(text.toUpperCase(), x + 5, y + 8, { width: columnWidths[i] - 10 });
    });

    y += rowHeight;

    // Draw rows
    doc.fontSize(14).font('Helvetica').fillColor('black');
    rows.forEach(row => {
        row.forEach((text, i) => {
            const x = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.rect(x, y, columnWidths[i], rowHeight).stroke();
            doc.text(text, x + 5, y + 8, { width: columnWidths[i] - 10 });
        });
        y += rowHeight;
    });
}

