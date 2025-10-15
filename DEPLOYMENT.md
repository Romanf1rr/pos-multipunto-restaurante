# 🚀 Guía de Despliegue en Google Cloud Platform

Esta guía detalla el proceso completo para desplegar el POS Multipunto en una VM de Google Cloud.

## 📋 Requisitos Previos

- Cuenta de Google Cloud (incluye $300 USD de crédito gratis)
- Repositorio: `https://github.com/Romanf1rr/pos-multipunto-restaurante.git`

---

## 🖥️ Paso 1: Crear VM en Google Cloud

### Configuración de la VM
```yaml
Nombre: pos-vm-25
Región: northamerica-south1-a
Tipo de máquina: e2-micro (2 vCPU, 1 GB RAM)
Sistema operativo: Ubuntu 22.04 LTS
Disco: 10 GB
Firewall: HTTP y HTTPS habilitados
```

---

## 🔥 Paso 2: Configurar Firewall

Crear regla para puerto 3000:
```
Nombre: allow-pos-server
Red: default
Dirección: Entrada
Origen: 0.0.0.0/0
Protocolo: tcp:3000
```

---

## 📦 Paso 3: Instalar Dependencias
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# Instalar PM2
sudo npm install -g pm2
```

---

## 📂 Paso 4: Clonar y Configurar
```bash
# Clonar repositorio
cd ~
git clone https://github.com/Romanf1rr/pos-multipunto-restaurante.git
cd pos-multipunto-restaurante

# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install
npm install jspdf jspdf-autotable
```

---

## ⚙️ Paso 5: Configurar Variables de Entorno
```bash
cd ~/pos-multipunto-restaurante/backend

cat > .env << 'ENVEOF'
PORT=3000
NODE_ENV=production
DB_PATH=./database/pos.db
JWT_SECRET=cambiar_por_clave_segura
PUBLIC_URL=http://TU_IP_PUBLICA:3000
SOCKET_PORT=3000
CORS_ORIGIN=http://localhost:3000,http://TU_IP_PUBLICA:3000
ENVEOF

mkdir -p database
```

---

## 🎨 Paso 6: Configurar y Construir Frontend
```bash
cd ~/pos-multipunto-restaurante/frontend/src/services
sed -i "s|http://localhost:3001|http://TU_IP_PUBLICA:3000|g" apiService.js

cd ~/pos-multipunto-restaurante/frontend
npm run build
```

---

## 🚀 Paso 7: Iniciar Servidor
```bash
cd ~/pos-multipunto-restaurante/backend

pm2 start server.js --name pos-server
pm2 startup
pm2 save
```

---

## 🔧 Comandos de Administración
```bash
pm2 status              # Ver estado
pm2 logs pos-server     # Ver logs
pm2 restart pos-server  # Reiniciar
pm2 stop pos-server     # Detener
pm2 monit               # Monitoreo en tiempo real
```

---

## 🔄 Actualizar desde GitHub
```bash
cd ~/pos-multipunto-restaurante
git pull
cd frontend && npm run build
pm2 restart pos-server
```

---

## 💰 Costos Mensuales

| Recurso | Costo (USD) |
|---------|-------------|
| VM e2-micro | $7-8 |
| Tráfico red | $1-2 |
| Almacenamiento | $0.40 |
| **Total** | **~$8-10** |

---

## 🔒 Seguridad
```bash
# Firewall UFW
sudo apt install -y ufw
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

---

## 📱 Acceso desde Dispositivos

Simplemente abre en cualquier navegador:
```
http://TU_IP_PUBLICA:3000
```

**No requiere estar en la misma red WiFi.**

---

## 🆘 Solución de Problemas

### Error de CORS
```bash
cat ~/pos-multipunto-restaurante/backend/.env | grep CORS_ORIGIN
# Verificar que incluya tu IP pública
```

### Puerto no accesible
```bash
# Verificar regla de firewall en GCP
sudo ufw status
```

### Ver logs de errores
```bash
pm2 logs pos-server --err --lines 50
```

---

**Última actualización:** Octubre 2025  
**Mantenido por:** Romanf1rr
