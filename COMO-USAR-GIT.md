# Cómo Sincronizar tu Proyecto con GitHub

Esta guía te explicará paso a paso cómo guardar y sincronizar los archivos de tu aplicación desde este entorno de desarrollo a un repositorio de GitHub.

## Prerrequisitos

1.  **Tener Git instalado** en tu ordenador. Si no lo tienes, puedes descargarlo desde [git-scm.com](https://git-scm.com/).
2.  **Tener una cuenta en GitHub**. Si no tienes una, puedes crearla en [github.com](https://github.com/).

---

## Parte 1: Subir el Proyecto por Primera Vez

Sigue estos pasos para conectar tu proyecto a un nuevo repositorio en GitHub.

### Paso 1: Descarga tu Proyecto

Busca una opción en este entorno para **descargar el código fuente del proyecto** en un archivo ZIP y descomprímelo en una carpeta de tu ordenador.

### Paso 2: Crea un Repositorio en GitHub

1.  Ve a tu perfil de GitHub y haz clic en el botón **"New"** para crear un nuevo repositorio.
2.  Dale un nombre a tu repositorio (por ejemplo, `lapizarra-app`).
3.  **Importante**: Asegúrate de que el repositorio sea **privado** (Private) si no quieres que otros vean tu código.
4.  **No selecciones** ninguna de las opciones para inicializar el repositorio con un archivo `README`, `.gitignore` o licencia, ya que tu proyecto ya los tiene.
5.  Haz clic en **"Create repository"**.

### Paso 3: Sube tu Código al Repositorio

Una vez creado el repositorio, GitHub te mostrará una página con instrucciones. Nos interesan los comandos para "push an existing repository from the command line".

1.  Abre una terminal o línea de comandos en tu ordenador.
2.  Navega hasta la carpeta donde descomprimiste tu proyecto.

    ```bash
    cd ruta/a/tu/proyecto
    ```

3.  Inicializa Git en esa carpeta:

    ```bash
    git init
    ```

4.  Añade todos los archivos de tu proyecto para el primer guardado (commit):

    ```bash
    git add .
    ```

5.  Crea el primer "commit", que es como una foto del estado actual de tu código:

    ```bash
    git commit -m "Primer commit: subida inicial del proyecto"
    ```

6.  Conecta tu repositorio local con el repositorio que creaste en GitHub. Copia y pega el comando que te proporciona GitHub. Será algo así:

    ```bash
    git remote add origin https://github.com/tu-usuario/tu-repositorio.git
    ```

7.  Verifica que la rama principal se llame `main` (es el estándar actual):

    ```bash
    git branch -M main
    ```

8.  Finalmente, sube tu código a GitHub:

    ```bash
    git push -u origin main
    ```

¡Listo! Si recargas la página de tu repositorio en GitHub, verás todos los archivos de tu proyecto.

---

## Parte 2: Sincronizar Cambios Futuros

Cada vez que hagamos cambios aquí y quieras guardarlos en GitHub, sigue este proceso:

1.  **Descarga la nueva versión** de tu proyecto (como en el Paso 1 de la primera parte).
2.  **Reemplaza los archivos antiguos** en tu carpeta local con los nuevos que has descargado. Git detectará automáticamente qué archivos han cambiado.
3.  Abre la terminal en la carpeta de tu proyecto.
4.  Añade los cambios detectados:

    ```bash
    git add .
    ```

5.  Crea un nuevo "commit" describiendo los cambios que hiciste. Sé descriptivo para que sepas qué cambiaste en el futuro.

    ```bash
    git commit -m "Ej: Añadido botón de goleadores en estadísticas"
    ```

6.  Sube los nuevos cambios a GitHub:

    ```bash
    git push origin main
    ```

Siguiendo estos pasos, tendrás tu repositorio de GitHub siempre actualizado con el trabajo que hacemos aquí.