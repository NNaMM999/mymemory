// 名前空間
let photoPreview = {};

//画像フォーカス
photoPreview.container = document.querySelector('#photo-preview');
photoPreview.photoImage = document.getElementById('photo-preview-photo');
photoPreview.sizeUpButton = document.getElementById('photo-preview-sizeup');
photoPreview.sizeDownButton = document.getElementById('photo-preview-sizedown');
photoPreview.closeButton = document.getElementById('photo-preview-close');
photoPreview.clickCheck = document.querySelectorAll('photo-preview-click-check')

// グローバル変数
photoPreview.scale = 1;
photoPreview.lastScale = 1;
photoPreview.startDist = 0;
photoPreview.translateX = (photoPreview.photoImage.offsetWidth / 2);
photoPreview.translateY = (photoPreview.photoImage.offsetHeight / 2);
photoPreview.pinchCenterX = 0;
photoPreview.pinchCenterY = 0;
photoPreview.lastTranslateX = 0;
photoPreview.lastTranslateY = 0;
photoPreview.startX = 0;
photoPreview.startY = 0;
photoPreview.minScale = 0.2;

// マウス操作の変数
photoPreview.photoPreviewMoveFlag = false;

// 画像を選択
photoPreview.clickedButtonName = ''; // 変数を初期化


// プレビュー画面を開く
photoPreview.openPreview = (src = "") => {

    photoPreview.container.classList.remove('photo-preview-hidden');
    // プレビューする写真を設定
    photoPreview.photoImage.src = src;
    photoPreview.translateX = -(photoPreview.photoImage.offsetWidth / 2) + (photoPreview.container.offsetWidth / 2);
    photoPreview.translateY = -(photoPreview.photoImage.offsetHeight / 2) + (photoPreview.container.offsetHeight / 2);
    photoPreview.lastTranslateX = photoPreview.translateX;
    photoPreview.lastTranslateY = photoPreview.translateY;
    photoPreview.photoImage.style.transform = `translate(${photoPreview.translateX}px, ${photoPreview.translateY}px) scale(${photoPreview.scale})`;

};


// 2点間の距離を計算する関数
photoPreview.getDistance= (touch1, touch2) => {
    let dx = touch1.clientX - touch2.clientX;
    let dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
};

// プレビューを閉じる
photoPreview.closeButton.addEventListener('click', (e) => {
    photoPreview.container.classList.add('photo-preview-hidden');
    photoPreview.scale = 1;
    photoPreview.lastScale = 1;
    photoPreview.translateX = -(photoPreview.photoImage.offsetWidth / 2) + (photoPreview.container.offsetWidth / 2);
    photoPreview.translateY = -(photoPreview.photoImage.offsetHeight / 2) + (photoPreview.container.offsetHeight / 2);
    photoPreview.photoImage.style.transform = `translate(${photoPreview.translateX}px, ${photoPreview.translateY}px) scale(${photoPreview.scale})`;
});


// ピンチ開始
photoPreview.photoImage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();

        photoPreview.startDist = photoPreview.getDistance(e.touches[0], e.touches[1]);
        photoPreview.lastScale = photoPreview.scale;

        // ピンチ中心を記録
        photoPreview.pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        photoPreview.pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    } else if (e.touches.length === 1) {
        // 1本指のパン操作
        photoPreview.startX = e.touches[0].clientX;
        photoPreview.startY = e.touches[0].clientY;
    }
});

// ピンチ中
photoPreview.photoImage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();

        let currentDist = photoPreview.getDistance(e.touches[0], e.touches[1]);
        let newScale = photoPreview.lastScale * (currentDist / photoPreview.startDist);

        if (newScale >= photoPreview.minScale) {
            // スケール比を計算
            let scaleRatio = newScale / photoPreview.scale;
            photoPreview.scale = newScale;

            // ピンチ中心に合わせて移動補正
            photoPreview.translateX = photoPreview.pinchCenterX - (photoPreview.pinchCenterX - photoPreview.translateX) * scaleRatio;
            photoPreview.translateY = photoPreview.pinchCenterY - (photoPreview.pinchCenterY - photoPreview.translateY) * scaleRatio;

            // 適用
            photoPreview.photoImage.style.transform =
                `translate(${photoPreview.translateX}px, ${photoPreview.translateY}px) scale(${photoPreview.scale})`;
        } else {
            // 1未満はリセット
            photoPreview.scale = photoPreview.minScale;
            photoPreview.photoImage.style.transform = `translate(${photoPreview.translateX}px, ${photoPreview.translateY}px) scale(${photoPreview.scale})`;

        }
    } else if (e.touches.length === 1) {
        // パン操作の処理
        let deltaX = e.touches[0].clientX - photoPreview.startX;
        let deltaY = e.touches[0].clientY - photoPreview.startY;
        photoPreview.translateX = photoPreview.lastTranslateX + deltaX;
        photoPreview.translateY = photoPreview.lastTranslateY + deltaY;
        photoPreview.photoImage.style.transform = `translate(${photoPreview.translateX}px, ${photoPreview.translateY}px) scale(${photoPreview.scale})`;

    }

});

// ピンチ終了
photoPreview.photoImage.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        photoPreview.lastScale = photoPreview.scale;
        photoPreview.lastTranslateX = photoPreview.translateX;
        photoPreview.lastTranslateY = photoPreview.translateY;
    }
});


// パソコンでの操作
// 画像の拡大
photoPreview.sizeUpButton.addEventListener('click', (e) =>{
    photoPreview.scale += 0.2;
    photoPreview.translateX += photoPreview.photoImage.offsetWidth * ((photoPreview.scale - 0.2) - photoPreview.scale) / 2;
    photoPreview.translateY += photoPreview.photoImage.offsetHeight * ((photoPreview.scale - 0.2) - photoPreview.scale) / 2;
    photoPreview.lastTranslateX = photoPreview.translateX;
    photoPreview.lastTranslateY = photoPreview.translateY;
    photoPreview.photoImage.style.transform = `translate(${photoPreview.translateX}px, ${photoPreview.translateY}px) scale(${photoPreview.scale})`;
});

// 画像の縮小
photoPreview.sizeDownButton.addEventListener('click', (e) =>{
    photoPreview.scale -= 0.2
    if (photoPreview.scale < photoPreview.minScale) {
        photoPreview.scale = photoPreview.minScale;
    } else {
        photoPreview.translateX += photoPreview.photoImage.offsetWidth * ((photoPreview.scale + 0.2) - photoPreview.scale) / 2;
        photoPreview.translateY += photoPreview.photoImage.offsetHeight * ((photoPreview.scale + 0.2) - photoPreview.scale) / 2;
        photoPreview.lastTranslateX = photoPreview.translateX;
        photoPreview.lastTranslateY = photoPreview.translateY;
        photoPreview.photoImage.style.transform = `translate(${photoPreview.translateX}px, ${photoPreview.translateY}px) scale(${photoPreview.scale})`;
    }
});

// マウスでの画像の移動のクリック
photoPreview.photoImage.addEventListener('mousedown',(e)=> {
    photoPreview.startX = e.clientX;
    photoPreview.startY = e.clientY;
    photoPreview.moveFlag = true;
});

// 画像の移動
photoPreview.photoImage.addEventListener('mousemove',(e)=> {

    if (photoPreview.moveFlag) {
        let deltaX = e.clientX - photoPreview.startX;
        let deltaY = e.clientY - photoPreview.startY;
        photoPreview.translateX = photoPreview.lastTranslateX + deltaX;
        photoPreview.translateY = photoPreview.lastTranslateY + deltaY;
        photoPreview.photoImage.style.transform = `translate(${photoPreview.translateX}px, ${photoPreview.translateY}px) scale(${photoPreview.scale})`;
    }

});
// 画像の移動終了
photoPreview.photoImage.addEventListener('mouseup', (e) => {
    photoPreview.lastScale = photoPreview.scale;
    photoPreview.lastTranslateX = photoPreview.translateX;
    photoPreview.lastTranslateY = photoPreview.translateY;
    photoPreview.moveFlag = false;
});

// ブラウザのドラッグ操作無効
photoPreview.photoImage.addEventListener('dragstart', (e) => {
    e.preventDefault();
});