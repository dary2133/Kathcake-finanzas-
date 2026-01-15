
import { getAccounts, getFixedExpenses, getFixedIncomes, getTransactions, getSettings } from '../app/lib/actions';
import * as fs from 'fs';
import * as path from 'path';

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', timestamp);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('Iniciando respaldo de base de datos...');

    const data = {
        accounts: await getAccounts(),
        fixedExpenses: await getFixedExpenses(),
        fixedIncomes: await getFixedIncomes(),
        transactions: await getTransactions(),
        settings: await getSettings()
    };

    fs.writeFileSync(
        path.join(backupDir, 'database_backup.json'),
        JSON.stringify(data, null, 2)
    );

    console.log(`Respaldo completado en: ${backupDir}`);
}

// Este script se puede llamar desde una ruta API o comando si el entorno lo permite.
