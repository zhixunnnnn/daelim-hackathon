// DOM 요소 선택
const uploadSection = document.getElementById('uploadSection');
const imageInput = document.getElementById('imageInput');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const errorMessage = document.getElementById('errorMessage');

let selectedImageBase64 = null;

// 업로드 섹션 클릭
uploadSection.addEventListener('click', () => {
    imageInput.click();
});

// 드래그 앤 드롭
uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.classList.add('dragover');
});

uploadSection.addEventListener('dragleave', () => {
    uploadSection.classList.remove('dragover');
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageUpload(files[0]);
    }
});

// 파일 선택
imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImageUpload(e.target.files[0]);
    }
});

// 이미지 업로드 처리
function handleImageUpload(file) {
    // 파일 타입 확인
    if (!file.type.startsWith('image/')) {
        showError('이미지 파일만 업로드할 수 있습니다.');
        return;
    }

    // 파일 크기 확인 (20MB)
    if (file.size > 20 * 1024 * 1024) {
        showError('파일 크기는 20MB 이하여야 합니다.');
        return;
    }

    // 파일을 Base64로 변환
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImageBase64 = e.target.result;
        previewImage.src = selectedImageBase64;
        previewSection.classList.add('show');
        resultSection.classList.remove('show');
        clearError();
    };
    reader.readAsDataURL(file);
}

// 분석 버튼 클릭
analyzeBtn.addEventListener('click', analyzeImage);

// 초기화 버튼 클릭
resetBtn.addEventListener('click', () => {
    selectedImageBase64 = null;
    imageInput.value = '';
    previewSection.classList.remove('show');
    resultSection.classList.remove('show');
    loading.classList.remove('show');
    clearError();
});

// 이미지 분석
async function analyzeImage() {
    if (!selectedImageBase64) {
        showError('이미지를 선택해주세요.');
        return;
    }

    analyzeBtn.disabled = true;
    loading.classList.add('show');
    resultSection.classList.remove('show');
    clearError();

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: selectedImageBase64,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '분석 중 오류가 발생했습니다.');
        }

        const data = await response.json();
        resultContent.textContent = data.analysis;
        resultSection.classList.add('show');
    } catch (error) {
        showError(error.message || '분석 중 오류가 발생했습니다.');
    } finally {
        loading.classList.remove('show');
        analyzeBtn.disabled = false;
    }
}

// 에러 메시지 표시
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

// 에러 메시지 제거
function clearError() {
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
}
