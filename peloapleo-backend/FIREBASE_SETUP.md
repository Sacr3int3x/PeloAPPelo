# Configuración de Firebase para Google Authentication

## 🚨 IMPORTANTE: Configuración Requerida

Para que funcione el inicio de sesión con Google, necesitas configurar las credenciales de Firebase Admin SDK.

## 📋 Pasos para obtener las credenciales:

### 1. Accede a Firebase Console

- Ve a [https://console.firebase.google.com/](https://console.firebase.google.com/)
- Selecciona tu proyecto: `peloapelo-13354`

### 2. Ve a Configuración del Proyecto

- En el menú lateral, haz click en el ícono de engranaje ⚙️
- Selecciona "Configuración del proyecto"

### 3. Ve a Cuentas de Servicio

- En la parte superior, haz click en la pestaña "Cuentas de servicio"
- Haz click en "Generar nueva clave privada"
- Selecciona "JSON" y haz click en "Generar clave"

### 4. Descarga y configura el archivo

- Se descargará un archivo JSON con tus credenciales
- **NO subas este archivo a Git** - contiene información sensible
- Copia los valores del JSON a tu archivo `.env`

## 🔧 Configuración del archivo .env

Abre el archivo `peloapleo-backend/.env` y reemplaza los valores placeholder con los del archivo JSON:

```env
# Copia estos valores exactos del archivo JSON descargado
FIREBASE_PRIVATE_KEY_ID=tu_private_key_id_aqui
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_contenido_de_clave_privada_aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=tu_client_email_aqui
FIREBASE_CLIENT_ID=tu_client_id_aqui
FIREBASE_CLIENT_X509_CERT_URL=tu_cert_url_aqui
```

### ⚠️ Importante sobre la Private Key:

- **Mantén los saltos de línea**: La private key debe estar entre comillas y mantener el formato `\n` para los saltos de línea
- **No modifiques el contenido**: Copia exactamente lo que está en el archivo JSON
- **Incluye las comillas**: El valor debe estar entre comillas dobles

## 🧪 Verificación

Después de configurar las credenciales:

1. Reinicia el servidor backend:

   ```bash
   cd peloapleo-backend
   npm start
   ```

2. Deberías ver en la consola:

   ```
   Firebase Admin initialized successfully
   ```

3. Si hay errores, revisa que todas las variables estén correctamente configuradas

## 🔍 Solución de Problemas

### Error: "Invalid PEM formatted message"

- Verifica que la `FIREBASE_PRIVATE_KEY` mantenga el formato correcto con `\n`
- Asegúrate de que esté entre comillas dobles

### Error: "Firebase Admin credentials not properly configured"

- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que no queden valores placeholder como "your_private_key_id"

### Error: "Project not found"

- Verifica que el `project_id` en el código coincida con tu proyecto Firebase

## 🔒 Seguridad

- **Nunca subas** el archivo JSON de credenciales a Git
- **Mantén** el archivo `.env` en `.gitignore`
- **Rota** las claves periódicamente desde Firebase Console

## 📞 Soporte

Si tienes problemas con la configuración, verifica:

1. Que el proyecto Firebase existe y está activo
2. Que tienes permisos de administrador en el proyecto
3. Que las credenciales no han expirado
