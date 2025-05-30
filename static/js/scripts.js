// Carga mensaje de bienvenida y CSV/metadata por defecto
document.addEventListener('DOMContentLoaded', function() {
    loadDefaultWelcomeCSVMetadata();
    // Envía el mensaje al presionar Enter en el textarea
    const textarea = document.getElementById('userQuery');
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('queryForm').requestSubmit();
        }
    });
});

// Enfoca el textarea
function forceTextareaFocus() {
    const textarea = document.getElementById('userQuery');
    if (textarea) textarea.focus();
}

window.addEventListener('focus', forceTextareaFocus);

document.addEventListener('mousedown', function(event) {
    const chatBox = document.getElementById('chatBox');
    if (chatBox && chatBox.contains(event.target)) {
        return;
    }
    setTimeout(forceTextareaFocus, 0);
});

// Carga mensaje de bienvenida inicial
function loadDefaultWelcomeCSVMetadata() {
    Promise.all([
        loadDefaultCSV(),
        loadDefaultMetadata()
    ]).then(() => {
        loadWelcomeMessage();
    });
};

// Mensaje de bienvenida inicial
function loadWelcomeMessage() {
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = '';
    const welcome = document.createElement('div');
    welcome.className = 'flex flex-col items-center justify-center h-full text-gray-400';
    const fileName = document.getElementById('selectedFileName').textContent;
    const metadataName = document.getElementById('selectedMetadataName').textContent;
    
    welcome.innerHTML = `<span class="block text-3xl font-bold text-center mb-2">Bienvenido a chatear con tus CSV</span>
        <span class="block text-lg text-center">Archivo CSV: <span class="text-blue-400">${fileName}</span></span>
        <span class="block text-lg text-center">Metadata: <span class="text-indigo-400">${metadataName}</span></span>`;
    chatBox.appendChild(welcome);
}

// Carga el archivo CSV por defecto
async function loadDefaultCSV() {
    const fileInput = document.getElementById('fileInput');
    const selectedFileName = document.getElementById('selectedFileName');
    const defaultFileUrl = 'https://raw.githubusercontent.com/bernabeudario/MATPLOTLIB-DASHBOARD/refs/heads/main/pokemon_combined.csv';
    try {
        const response = await fetch(defaultFileUrl);
        const blob = await response.blob();
        const file = new File([blob], "pokemon_combined.csv", { type: "text/csv" });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        if (selectedFileName) selectedFileName.textContent = "pokemon_combined.csv";
    } catch (error) {
        return console.error('Error al cargar CSV:', error);
    }
}

// Carga metadata por defecto
async function loadDefaultMetadata() {
    const metadataInput = document.getElementById('metadataInput');
    const selectedMetadataName = document.getElementById('selectedMetadataName');
    const defaultMetadataUrl = 'https://raw.githubusercontent.com/bernabeudario/MATPLOTLIB-DASHBOARD/refs/heads/main/pokemon_metadata.md';
    try {
        const response = await fetch(defaultMetadataUrl);
        const blob = await response.blob();
        const metadata = new File([blob], "pokemon_metadata.md", { type: "text" });
        const metadataTransfer = new DataTransfer();
        metadataTransfer.items.add(metadata);
        metadataInput.files = metadataTransfer.files;
        if (selectedMetadataName) selectedMetadataName.textContent = "pokemon_metadata.md";
    } catch (error) {
        return console.error('Error al cargar Metadata:', error);
    }
}

// Limpiar selección de archivo CSV
function clearFile() {
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('selectedFileName');
    if (fileInput) {
        fileInput.value = '';
    }
    if (fileName) {
        fileName.textContent = 'Ningún archivo seleccionado';
        loadWelcomeMessage();
    }
}

// Limpiar selección de metadata
function clearMetadata() {
    const metadataInput = document.getElementById('metadataInput');
    const metadataName = document.getElementById('selectedMetadataName');
    if (metadataInput) {
        metadataInput.value = '';
        metadataName.textContent = 'Metadata no cargada';
        loadWelcomeMessage();
    }
}

// Formatea el contenido de la respuesta del modelo
function formatResponseContent(content) {
    content = content.replace('# CODIGO PYTHON', '');
    content = content.replace(/^# (.+)$/gm, '<h2 class="text-x2 font-bold">$1</h2>');
    content = content.replace(/^\* (.+)$/gm, '<li class="list-disc ml-4">$1</li>');
    content = content.replace(/^- (.+)$/gm, '<li class="list-disc ml-4">$1</li>');
    content = content.replace(/^ {4}\* (.+)$/gm, '<li class="list-disc ml-12">$1</li>');
    content = content.replace(/^ {4}- (.+)$/gm, '<li class="list-disc ml-12">$1</li>');
    content = content.replace(/^ {8}\* (.+)$/gm, '<li class="list-disc ml-20">$1</li>');
    content = content.replace(/^ {8}- (.+)$/gm, '<li class="list-disc ml-20">$1</li>');
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\n/g, '<br>');

    content = content.replace(/<\/h2><br>/g, '</h2>');
    content = content.replace(/<\/li><br>/g, '</li>');
    content = content.replace(/<br><br><br><br>/g, '<br><br>');
    return content;
}

// Utiliza /run-query para enviar la consulta y obtener la respuesta del modelo
async function handleFormSubmit(event) {
    event.preventDefault(); // Evita que el formulario se envíe de forma predeterminada
    setFormEnabled(false); // Deshabilita todo

    const chatBox = document.getElementById('chatBox');
    // Si solo está el mensaje de bienvenida, lo quitamos antes de agregar el primer mensaje
    if (!chatBox.firstChild.classList.contains('message')) {
        chatBox.innerHTML = '';
    }

    const userQuery = document.getElementById('userQuery').value;
    const fileInput = document.getElementById('fileInput');
    const metadataInput = document.getElementById('metadataInput');
    const formData = new FormData();

    // Agrega el archivo CSV si está presente
    if (fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
    }
    // Agrega el archivo de metadata si está presente
    if (metadataInput.files.length > 0) {
        formData.append('metadataFile', metadataInput.files[0]);
    }
    formData.append('userQuery', userQuery);

    // Agrega la consulta del usuario al chat
    const userMessage = document.createElement('div');
    userMessage.className = 'message user bg-green-100 text-right p-3 rounded-lg mb-2 max-w-[70%] ml-auto';
    userMessage.textContent = userQuery;
    chatBox.appendChild(userMessage);

    // Limpia el campo de entrada
    document.getElementById('userQuery').value = '';

    // Agrega un spinner y el mensaje temporal "Creando respuesta..."
    const thinkingMessage = document.createElement('div');
    thinkingMessage.className = 'message bot bg-gray-200 p-3 rounded-lg mb-2 max-w-fit';
    const spinner = document.createElement('span');
    spinner.innerHTML = `
        <svg class="animate-spin inline-block w-6 h-6 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
    `;
    thinkingMessage.appendChild(spinner);
    thinkingMessage.appendChild(document.createTextNode('Creando respuesta...'));
    chatBox.appendChild(thinkingMessage);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/run-query', {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();

        // Reemplaza el mensaje "Creando respuesta..." con la respuesta del modelo
        thinkingMessage.remove();
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot bg-blue-100 p-3 rounded-lg mb-2 max-w-[80%]';
        botMessage.innerHTML = formatResponseContent(data.response); // Formatea el contenido
        chatBox.appendChild(botMessage);

        // Si existe se añade al chat el chart.png generado
        const chart = document.createElement('img');
        chart.src = `./static/tmp/chart.png?timestamp=${new Date().getTime()}`;
        chart.title = "Clic para ampliar";
        chart.className = 'mt-2 rounded-lg shadow-lg cursor-pointer';
        chart.onload = () => {
            chatBox.appendChild(chart);
            chatBox.appendChild(document.createElement('br'));
        };
        chart.onclick = () => openModal(chart.src);

    } catch (error) {
        console.error('Error:', error);
        thinkingMessage.remove();
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message error bg-red-100 p-3 rounded-lg mb-2 max-w-[80%]';
        errorMessage.textContent = 'Error al obtener la respuesta.';
        chatBox.appendChild(errorMessage);

    } finally {
        setFormEnabled(true); // Habilita todo al terminar
    }
}

// Muestra el nombre del archivo seleccionado
function handleFileSelect(event) {
    const fileInput = event.target;
    const fileName = fileInput.files[0]?.name || "Debes seleccionar un archivo CSV";
    document.getElementById('selectedFileName').textContent = fileName;
}

// Muestra el nombre de la metadata seleccionada
function handleMetadataSelect(event) {
    const metadataInput = event.target;
    const metadataName = metadataInput.files[0]?.name || "Debes seleccionar un archivo CSV";
    document.getElementById('selectedMetadataName').textContent = metadataName;
}

// Muestra la pregunta por defecto según el número
function handleDefaultQuestion(num) {
    let defaultQuestion;
    const questions = {
        1: "Responde a lo siguiente: 1) Qué puedes hacer? Cómo me puedes ayudar?. 2) Responde solo con texto, sin código Python: qué datos tienes para realizar el análisis, cuál es la descripción de cada columna y qué tipo de dato contiene cada columna.",
        2: "Dame una lista de 3 análisis interesantes que se pueden realizar con el dataset. Indícame el nombre del análisis y cuál es el prompt que te tengo que escribir.",
        3: "Quiero un HeatMap comparando las principales columnas con valores numéricos entre sí, de este modo podré analizar si existe relación entre ellas. Presenta un gráfico fácil de leer con textos de buen tamaño. Utiliza los siguiente colores según el valor de las columnas analizadas: de -1 a -0.5 color gris oscuro; de -0.5 a 0 color gris claro; de 0 a 0.5 color amarillo; de 0.5 a 1 color verde.",
        4: "Quiero un Chart en donde se muestren Boxplots de cada columna de tipo numérico. Incluir valores outliers como puntos rojos. Los Boxplots deben ser de color celeste pastel.",
        5: "Quiero que en base a la descripción de los datos que tienes pienses un un buen análisis para generar un Scatter Chart analítico en el que se crucen con valores de dos columnas con valores numéricos. Intenta que el Chart contenga información que pueda ser utilizada para la toma de decisiones. Presenta el chart con colores llamativos. Utiliza los nombres de las columnas que tienes.",
        6: "Quiero un análisis de la distribución normal al menos 5 columnas que tengan valores numéricos. Muestra la distribución normal de cada columna en un Chart diferente. Incluye un Chart con todas las distribuciones normales a fin de poder compararlas entre sí. Excluye las columnas referidas al ID o claves."
    };
    defaultQuestion = questions[num] || "Pregunta no válida";
    document.getElementById('userQuery').value = defaultQuestion;
    document.getElementById('queryForm').requestSubmit();
}

// Muestra el modal con la imagen ampliada
function openModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageSrc;
    modal.classList.remove('hidden');
}

// Cierra el modal
function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.add('hidden');
}

// Resetea el chat y carga el CSV por defecto
function resetChat() {
    fetch('/reset-chat', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            loadWelcomeMessage();
        });
}

// Habilita o deshabilita los elementos del panel izquierdo
function setFormEnabled(enabled) {
    const form = document.getElementById('sidePanelContent');
    if (!form) return;
    form.querySelectorAll('input, textarea, button, select, label, span').forEach(el => {
        el.disabled = !enabled;
        el.classList.toggle('opacity-50', !enabled);
        el.classList.toggle('cursor-not-allowed', !enabled);

        // Remove all hover classes first
        el.classList.remove('hover:bg-blue-600', 'hover:bg-gray-300', 'hover:bg-violet-700', 'hover:bg-green-700');

        if (enabled) {
            if (el.classList.contains('bg-blue-500')) el.classList.add('hover:bg-blue-600');
            if (el.classList.contains('bg-gray-200')) el.classList.add('hover:bg-gray-300');
            if (el.classList.contains('bg-violet-600')) el.classList.add('hover:bg-violet-700');
            if (el.classList.contains('bg-green-600')) el.classList.add('hover:bg-green-700');
        }
    });
}

// Actualiza el archivo seleccionado y borra el historial de chat
function updateSelectedFileName(input) {
    const fileNameSpan = document.getElementById('selectedFileName');
    if (input.files && input.files.length > 0) {
        fileNameSpan.textContent = input.files[0].name;
        // Borra el historial de chat al seleccionar un archivo
        fetch('/reset-chat', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                clearMetadata();
                loadWelcomeMessage();
        });
    } else {
        fileNameSpan.textContent = 'Ningún archivo seleccionado';
    }
}

// Actualiza la metadata seleccionada y borra el historial de chat
function updateSelectedMetadataName(input) {
    const metadataNameSpan = document.getElementById('selectedMetadataName');
    if (input.files && input.files.length > 0) {
        metadataNameSpan.textContent = input.files[0].name;
        // Borra el historial de chat al seleccionar un archivo
        fetch('/reset-chat', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                loadWelcomeMessage();
        });
    } else {
        metadataNameSpan.textContent = 'Metadata no cargada';
    }
}

// Amplia o colapsa el panel izquierdo
function togglePanel() {
    const panel = document.getElementById('sidePanel');
    const content = document.getElementById('sidePanelContent');
    const main = document.getElementById('mainContent');
    if (panel.classList.contains('w-12')) {
        panel.classList.remove('w-12');
        panel.classList.add('w-80');
        content.classList.remove('hidden');
        main.classList.remove('ml-12');
        main.classList.add('ml-80');
    } else {
        panel.classList.remove('w-80');
        panel.classList.add('w-12');
        content.classList.add('hidden');
        main.classList.remove('ml-80');
        main.classList.add('ml-12');
    }
}
