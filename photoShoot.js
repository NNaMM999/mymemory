// 名前空間
photoShoot = {};

photoShoot.container = document.querySelector('#photo-shoot');
photoShoot.video = document.querySelector('#photo-shoot-camera');
photoShoot.shootButton = document.querySelector('#photo-shoot-shoot-button');
photoShoot.changeCameraButton = document.querySelector('#photo-shoot-camera-change');
photoShoot.resultImage = document.querySelector('#photo-shoot-result-image');
photoShoot.closeButton = document.querySelector('#photo-shoot-close');
photoShoot.control = document.querySelector('.photo-shoot-control');
photoShoot.finishControl = document.querySelector('.photo-shoot-finish-control');
photoShoot.retakeButton = document.querySelector('#photo-shoot-retake-button');
photoShoot.completeButton = document.querySelector('#photo-shoot-complete-button');

photoShoot.shootPhotoSrc = "";

// 撮影した写真を取得
photoShoot.getShootedPhoto = function () {
    return photoShoot.shootPhotoSrc;
}

photoShoot.useCamera = null;
photoShoot.stream = null;
photoShoot.constraints = null;
photoShoot.track = null;
photoShoot.settings = null;
photoShoot.width = 0;
photoShoot.height = 0;
photoShoot.tool = null;
photoShoot.displayWidth = { min: 1280, ideal: 1920, max: 1920 };
photoShoot.displayHeight = { min: 720, ideal: 1080, max: 1080 };

// カメラが使えたらボタンを有効化
document.addEventListener('DOMContentLoaded', async () => {

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            console.log("カメラが使えます");
            // 後で使わない場合はリソースを解放
            stream.getTracks().forEach(track => track.stop());
            document.querySelector("#photo-shoot-start-button").disabled = false;

        })
        .catch(err => {
            console.error("カメラが使えません", err.name, err.message);
        });


});


// カメラの向きをの画面の向きに合わせる
window.addEventListener("orientationchange", async function () {

    if (photoShoot.container.classList.contains('photo-shoot-hidden')) {
        return;
    }
    if (!photoShoot.finishControl.classList.contains("photo-shoot-hidden")) {
        return;
    }

    const screenType = screen.orientation.type;
    if (screenType.startsWith("portrait")) {
        width = { min: 720, ideal: 1080, max: 1080 };
        height = { min: 1280, ideal: 1920, max: 1920 };
    } else {
        width = { min: 1280, ideal: 1920, max: 1920 };
        height = { min: 720, ideal: 1080, max: 1080 };
    }

    if (photoShoot.stream) photoShoot.stream.getTracks().forEach(track => track.stop());
    photoShoot.stream = null; // 古い参照を残さない

    // カメラ起動            
    photoShoot.stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: { exact: photoShoot.useCamera },
            width: photoShoot.displayWidth,
            height: photoShoot.displayHeight
        },
        audio: false
    });
    photoShoot.constraints = {
        width: photoShoot.displayWidth,
        height: photoShoot.displayHeight
    };
    [photoShoot.track] = photoShoot.stream.getVideoTracks();
    await photoShoot.track.applyConstraints(photoShoot.constraints);
    photoShoot.settings = photoShoot.track.getSettings();
    [photoShoot.width, photoShoot.height] = [photoShoot.settings.width, photoShoot.settings.height];
    photoShoot.video.srcObject = photoShoot.stream;

    photoShoot.video.classList.remove("photo-shoot-hidden")
    photoShoot.control.classList.remove("photo-shoot-hidden");
    photoShoot.finishControl.classList.add("photo-shoot-hidden");
    photoShoot.resultImage.classList.add("photo-shoot-hidden");


});

// 撮影画面を開く
photoShoot.openCamera = async function (tool = () => { return }) {


    try {

        photoShoot.container.classList.remove('photo-shoot-hidden');

        photoShoot.useCamera = 'environment';

        photoShoot.stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: photoShoot.useCamera
            },
            audio: false
        });
        photoShoot.constraints = {
            width: photoShoot.displayWidth,
            height: photoShoot.displayHeight
        };
        [photoShoot.track] = photoShoot.stream.getVideoTracks();
        await photoShoot.track.applyConstraints(photoShoot.constraints);
        photoShoot.settings = photoShoot.track.getSettings();
        [photoShoot.width, photoShoot.height] = [photoShoot.settings.width, photoShoot.settings.height];

        photoShoot.video.srcObject = photoShoot.stream;
        photoShoot.tool = tool;
    } catch (err) {
        console.error(err)
    }

};


// 撮影
photoShoot.shootButton.addEventListener('click', event => {
    const canvas = document.createElement('canvas');

    const screenType = screen.orientation.type;
    // 幅高さがひっくり返っている場合の補正(android)]
    console.log(screenType);
    if (screenType == "portrait-primary" || screenType == "portrait-secondary") {
        if (photoShoot.height > photoShoot.width) {
            let temp = photoShoot.height;
            photoShoot.height = photoShoot.width;
            photoShoot.width = temp;
        }
    } else {
        if (photoShoot.height < photoShoot.width) {
            let temp = photoShoot.height;
            photoShoot.height = photoShoot.width;
            photoShoot.width = temp;
        }
    }
    canvas.setAttribute('width', photoShoot.height);
    canvas.setAttribute('height', photoShoot.width);


    const context = canvas.getContext('2d');
    context.drawImage(photoShoot.video, 0, 0, photoShoot.height, photoShoot.width);

    const dataUrl = canvas.toDataURL('image/jpeg');
    photoShoot.resultImage.src = dataUrl;

    if (photoShoot.stream) photoShoot.stream.getTracks().forEach(track => track.stop());
    photoShoot.stream = null; // 古い参照を残さない


    photoShoot.video.classList.add("photo-shoot-hidden")
    photoShoot.control.classList.add("photo-shoot-hidden");
    photoShoot.finishControl.classList.remove("photo-shoot-hidden");
    photoShoot.resultImage.classList.remove("photo-shoot-hidden");


});


// 画面前後ろ切り替え
photoShoot.changeCameraButton.addEventListener('click', async (e) => {

    if (photoShoot.stream) photoShoot.stream.getTracks().forEach(track => track.stop());
    photoShoot.stream = null; // 古い参照を残さない

    photoShoot.useCamera = (photoShoot.useCamera == 'environment') ? 'user' : 'environment';

    photoShoot.stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: { exact: photoShoot.useCamera }
        },
        audio: false
    });
    [photoShoot.track] = photoShoot.stream.getVideoTracks();
    await photoShoot.track.applyConstraints(photoShoot.constraints);
    photoShoot.settings = photoShoot.track.getSettings();
    [photoShoot.width, photoShoot.height] = [photoShoot.settings.width, photoShoot.settings.height];
    photoShoot.video.srcObject = photoShoot.stream;



});


// カメラをキャンセルしてやめる
photoShoot.closeButton.addEventListener('click', (e) => {

    if (photoShoot.stream) photoShoot.stream.getTracks().forEach(track => track.stop());
    photoShoot.stream = null; // 古い参照を残さない

    photoShoot.container.classList.add('photo-shoot-hidden');
    photoShoot.video.classList.remove("photo-shoot-hidden")
    photoShoot.control.classList.remove("photo-shoot-hidden");
    photoShoot.finishControl.classList.add("photo-shoot-hidden");
    photoShoot.resultImage.classList.add("photo-shoot-hidden");

});

// 撮影を確定
photoShoot.completeButton.addEventListener('click', (e) => {

    // 写真を記録
    photoShoot.shootPhotoSrc = photoShoot.resultImage.src;

    photoShoot.container.classList.add('photo-shoot-hidden');
    photoShoot.video.classList.remove("photo-shoot-hidden")
    photoShoot.control.classList.remove("photo-shoot-hidden");
    photoShoot.finishControl.classList.add("photo-shoot-hidden");
    photoShoot.resultImage.classList.add("photo-shoot-hidden");

    photoShoot.tool();

});

// もう一度撮影
photoShoot.retakeButton.addEventListener('click', async (e) => {


    if (photoShoot.stream) photoShoot.stream.getTracks().forEach(track => track.stop());
    photoShoot.stream = null; // 古い参照を残さない

    // カメラ起動            
    photoShoot.stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: { exact: photoShoot.useCamera }
        },
        audio: false
    });
    [photoShoot.track] = photoShoot.stream.getVideoTracks();
    await photoShoot.track.applyConstraints(photoShoot.constraints);
    photoShoot.settings = photoShoot.track.getSettings();
    [photoShoot.width, photoShoot.height] = [photoShoot.settings.width, photoShoot.settings.height];
    photoShoot.video.srcObject = photoShoot.stream;

    photoShoot.video.classList.remove("photo-shoot-hidden")
    photoShoot.control.classList.remove("photo-shoot-hidden");
    photoShoot.finishControl.classList.add("photo-shoot-hidden");
    photoShoot.resultImage.classList.add("photo-shoot-hidden");



});