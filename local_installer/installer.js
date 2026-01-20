// installer.js - Instalador automático
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔄 Instalando Servicio de Impresión Kathcake...');

// Crear carpeta de servicio
const servicePath = path.join(process.env.APPDATA || process.env.HOME, 'KathcakePrinter');
if (!fs.existsSync(servicePath)) {
    fs.mkdirSync(servicePath, { recursive: true });
}

// Crear archivo principal del servicio
const serviceCode = `
const express = require('express');
const EscPos = require('escpos');
const Usb = require('escpos-usb');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const CONFIG_FILE = path.join(__dirname, 'printer-config.json');
let printer = null;
let printerConfig = {};

// Cargar configuración
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            printerConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch (e) {
        console.log('No hay configuración previa');
    }
}

// Guardar configuración
function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(printerConfig, null, 2));
}

// Conectar a impresora
function connectPrinter() {
    try {
        const vendorId = printerConfig.vendorId || '0x04b8';
        const productId = printerConfig.productId || '0x0202';
        
        const device = new Usb();
        device.open((err) => {
            if (err) {
                console.log('⚠️ Impresora desconectada');
                printer = null;
                return;
            }
            printer = new EscPos(device);
            console.log('✅ Impresora conectada');
        });
    } catch (error) {
        console.log('❌ Error con impresora:', error.message);
    }
}

// API Routes
app.get('/status', (req, res) => {
    res.json({
        service: 'Kathcake Printer Service',
        version: '1.0.0',
        printerConnected: !!printer,
        config: printerConfig,
        timestamp: new Date().toISOString()
    });
});

app.post('/config', (req, res) => {
    printerConfig = { ...printerConfig, ...req.body };
    saveConfig();
    connectPrinter();
    res.json({ success: true, config: printerConfig });
});

app.post('/print/receipt', (req, res) => {
    if (!printer) {
        return res.status(500).json({ 
            error: 'Impresora no conectada',
            help: 'Conecte una impresora térmica USB y reinicie el servicio'
        });
    }

    const { receipt } = req.body;
    
    try {
        // Imprimir encabezado
        printer
            .font('a')
            .align('ct')
            .style('b')
            .size(1, 1)
            .text('KATHCAKE POS')
            .text('='.repeat(32));
        
        // Información de factura
        printer
            .align('lt')
            .style('normal')
            .size(1, 1)
            .text(\`FACTURA: \${receipt.invoiceNumber}\`)
            .text(\`FECHA: \${new Date().toLocaleString()}\`)
            .text(\`CLIENTE: \${receipt.customerName || 'Mostrador'}\`)
            .text('='.repeat(32));
        
        // Items
        receipt.items.forEach((item, index) => {
            const name = (item.name || 'Producto').substring(0, 20);
            const qty = item.quantity || 1;
            const price = item.price || 0;
            const total = qty * price;
            
            printer.text(
                \`\${name.padEnd(20)} x\${qty} $\${total.toFixed(2)}\`
            );
        });
        
        // Totales
        printer
            .text('='.repeat(32))
            .align('rt')
            .text(\`SUBTOTAL: $\${receipt.subtotal?.toFixed(2) || '0.00'}\`)
            .text(\`IVA: $\${receipt.tax?.toFixed(2) || '0.00'}\`);
        
        if (receipt.discount > 0) {
            printer.text(\`DESC.: -$\${receipt.discount.toFixed(2)}\`);
        }
        
        printer
            .style('bu')
            .text(\`TOTAL: $\${receipt.total.toFixed(2)}\`)
            .style('normal')
            .align('ct')
            .text('='.repeat(32))
            .text(receipt.footerMessage || '¡Gracias por su compra!')
            .cut()
            .close();
        
        res.json({ 
            success: true, 
            message: 'Factura impresa',
            receiptNumber: receipt.invoiceNumber
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/print/test', (req, res) => {
    if (!printer) {
        return res.status(500).json({ error: 'Impresora no conectada' });
    }
    
    try {
        printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(1, 1)
            .text('PRUEBA DE IMPRESIÓN')
            .text('KATHCAKE POS')
            .text(new Date().toLocaleString())
            .text('='.repeat(32))
            .text('✅ Sistema funcionando')
            .text('✅ Impresora conectada')
            .text('✅ Listo para usar')
            .cut()
            .close();
        
        res.json({ success: true, message: 'Prueba impresa' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar servicio
loadConfig();
connectPrinter();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(\`🖨️ Servicio de impresión escuchando en http://localhost:\${PORT}\`);
    console.log('✅ Listo para recibir impresiones desde Kathcake POS');
});
`;

fs.writeFileSync(path.join(servicePath, 'service.js'), serviceCode);

// Crear package.json para el servicio
const packageJson = {
    name: "kathcake-printer-service",
    version: "1.0.0",
    main: "service.js",
    scripts: {
        start: "node service.js"
    },
    dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "escpos": "^3.0.0-alpha.6",
        "escpos-usb": "^3.0.0-alpha.4"
    }
};

fs.writeFileSync(
    path.join(servicePath, 'package.json'), 
    JSON.stringify(packageJson, null, 2)
);

// Crear script de inicio automático
const startScript = `cd "${servicePath.replace(/\\/g, '/')}" && npm install && npm start`;

console.log('✅ Instalación completada');
console.log('📁 Servicio instalado en:', servicePath);
console.log('\n📝 Para iniciar el servicio manualmente:');
console.log(`cd "${servicePath}"`);
console.log('npm install');
console.log('npm start');
console.log('\n🌐 Luego accede a: http://localhost:3001/status');

// Preguntar si instalar como servicio Windows
if (process.platform === 'win32') {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.question('\n¿Instalar como servicio de Windows (se ejecutará al iniciar PC)? (s/n): ', (answer) => {
        if (answer.toLowerCase() === 's') {
            installAsWindowsService(servicePath);
        }
        readline.close();
    });
}

function installAsWindowsService(servicePath) {
    const serviceInstaller = `
const Service = require('node-windows').Service;
const svc = new Service({
    name: 'KathcakePrinter',
    description: 'Servicio de impresión para Kathcake POS',
    script: '${servicePath.replace(/\\/g, '/')}/service.js',
    nodeOptions: []
});

svc.on('install', () => {
    svc.start();
    console.log('✅ Servicio instalado y ejecutándose');
});

svc.on('alreadyinstalled', () => {
    console.log('⚠️ El servicio ya estaba instalado');
});

svc.install();
`;
    
    fs.writeFileSync(path.join(servicePath, 'install-service.js'), serviceInstaller);
    console.log('🔧 Ejecute: node install-service.js para completar');
}
