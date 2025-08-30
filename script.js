let db;
let currentPhoto = null;
let allTags = {};
let allPhotos = [];

const gallery = document.getElementById('gallery');
const suggestionList = document.getElementById('suggestionList');
const searchInput = document.getElementById('searchInput');
const showSearchButton = document.getElementById('showSearchButton');
const searchArea = document.getElementById('searchArea');
const searchButton = document.getElementById('searchButton');
const addButton = document.getElementById('addButton');
const fileInput = document.getElementById('fileInput');
const previewImage = document.getElementById('previewImage');
const modalAddTagButton = document.getElementById('modalAddTagButton');
const modalSelectedTags = document.getElementById('modalSelectedTags');
const taggingModal = document.getElementById('taggingModal');
const modalTagInput = document.getElementById('modalTagInput');
const savePhotoButton = document.getElementById('savePhotoButton');

//非同期で初期設定
document.addEventListener('DOMContentLoaded', async () => {
  db = await PhotoAndTagDataBase.init();
  //初期化のチェック
  if (!db.dataBase) {
    console.error('IndexedDBの初期化に失敗しました。');
    return;
  }
  //すべてのデータ読み込む
  await loadAllData();
  //画面に写真を描画
  renderGallery(allPhotos);
});

//写真とタグを非同期で読み込む
async function loadAllData() {
  allPhotos = await db.getPhotos();
  allTags = await db.getTags();
}

//ウェブページ上にギャラリー作成
function renderGallery(photosToDisplay) {
  gallery.innerHTML = '';
  if (photosToDisplay.length === 0) {
    gallery.innerHTML =
      '<p class="text-center text-gray-500 col-span-4">写真がありません。</p>';
    return;
  }
  photosToDisplay.forEach((photo) => {
    const photoCard = document.createElement('div');
    // クラス名から Tailwind CSS のレイアウト関連のものを削除し、
    // CSSの #gallery .item に任せる
    photoCard.className = 'item'; // style.css で定義された .item クラスのみを適用

    const img = document.createElement('img');
    img.src = photo.img;
    img.alt = photo.date;
    // img のクラス名から Tailwind CSS のレイアウト関連のものを削除
    // style.css の #gallery .item img に任せる
    img.className = 'photo-thumbnail'; // 新しいクラス名（または空でも可）

    // プレビュー画面表示用
    img.addEventListener('click', async (e) => {
      photoPreview.openPreview(img.src);
    });

    photoCard.appendChild(img); // まず画像をカードに追加

    // タグ表示エリアを画像の下に配置
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'overlay'; // style.css で定義された .overlay クラス
    const tagListDiv = document.createElement('div');
    tagListDiv.className = 'tag-list';// Tailwind CSS を変更

    photo.tag.name.forEach((tagName) => {
      const tagSpan = document.createElement('span');
      // style.css の #gallery .item span に任せる
      tagSpan.textContent = `#${tagName}`;
      tagListDiv.appendChild(tagSpan);
    });

    // 削除ボタンを追加
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = `<span class="trash-icon">X</span>`;
    // 削除ボタンに写真のIDを紐づける
    deleteButton.dataset.photoId = photo;
    deleteButton.addEventListener('click', async (e) => {
      // クリックイベントが親要素に伝播するのを防ぐ
      e.stopPropagation();
      if (confirm('この写真を削除してもよろしいですか？')) {
        await db.deletePhoto(photo);
        renderGallery(allPhotos);
      }
    });

    tagsDiv.appendChild(tagListDiv);
    photoCard.appendChild(tagsDiv); // タグ表示エリアをカードに追加
    gallery.appendChild(photoCard);

    photoCard.appendChild(deleteButton);
  });
}

//タグの候補
function renderTagSuggestions(query = '') {
  //すべてのタグをリストとして取り出す
  const tagNames = Object.keys(allTags);
  //検索候補のリストを一度空にする
  suggestionList.innerHTML = '';

  // クエリ(検索欄)が空の場合は全てのタグを表示
  const tagsToDisplay = query
    ? tagNames.filter((tag) => tag.includes(query))
    : tagNames;
  //表示すべきタグがあるとき
  if (tagsToDisplay.length > 0) {
    tagsToDisplay.forEach((tagName) => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';//tailwindcss変更
      li.textContent = `#${tagName}`;
      li.addEventListener('click', () => {
        //フィルタリング
        const photoWithTag = allPhotos.filter((photo) =>
          photo.tag.name.includes(tagName)
        );
        //選択したタグの写真を表示
        renderGallery(photoWithTag);
        //クリックされたタグを検索ボックスに入力
        searchInput.value = tagName;
        // ▼▼▼ 修正 ▼▼▼
        // 選択後にサジェストリストを非表示にする
        suggestionList.style.display = 'none';
      });
      //###↓これを追加することで検索候補が表示される###
      suggestionList.appendChild(li);
    });
  } /*表示すべきタグがないとき*/ else {
    const li = document.createElement('li');
    li.textContent = '該当するタグがありません。';
    li.className = 'no-tag-message p-2';
    suggestionList.appendChild(li);
  }
}

//イベントリスナー
//検索ボタン
//検索候補のところを表示
showSearchButton.addEventListener('click', () => {
  //toggleでhiddenクラスを表示、非表示する
  // 補足: 現在のHTMLには searchArea というIDの要素がないため、この機能は正しく動作しません。
  if (searchArea) {
    searchArea.classList.toggle('hidden');
    if (!searchArea.classList.contains('hidden')) {
      // 検索エリアが表示されたら、保存したタグを表示
      renderTagSuggestions();
    }
  }
});

//検索ワード検索
searchButton.addEventListener('click', () => {
  //前後の空白削除
  const query = searchInput.value.trim();
  //検索欄が空でないとき
  if (query) {
    //検索欄に入れたキーワードの写真を表示
    const photoWithTag = allPhotos.filter((photo) =>
      photo.tag.name.includes(query)
    );
    renderGallery(photoWithTag);
  } /*検索欄が空の時*/ else {
    renderGallery(allPhotos);
  }
  // ▼▼▼ 修正 ▼▼▼
  // 検索実行後、サジェストリストを非表示にする
  suggestionList.style.display = 'none';
});

// ▼▼▼ ここから修正・追加 ▼▼▼

// 検索欄にフォーカスが当たった時にサジェストを表示
searchInput.addEventListener('focus', () => {
  suggestionList.style.display = 'block';
  renderTagSuggestions(searchInput.value.trim());
});

// 検索欄からフォーカスが外れた時にサジェストを非表示
searchInput.addEventListener('blur', () => {
  // サジェスト内の項目をクリックする猶予を与えるため、少し遅らせて非表示にする
  setTimeout(() => {
    suggestionList.style.display = 'none';
  }, 200);
});

//検索候補入力によって更新
searchInput.addEventListener('input', () => {
  //入力中は常にサジェストを表示
  suggestionList.style.display = 'block';
  //前後の空白削除
  const query = searchInput.value.trim();
  //取得したqueryをrenderTagSuggestionsに渡す
  renderTagSuggestions(query);
});

// ▲▲▲ ここまで修正・追加 ▲▲▲

//写真追加ファイル選択(写真追加ボタン=addButton)
addButton.addEventListener('click', () => {
  fileInput.click();
});

//写真選択完了したら
fileInput.addEventListener('change', (e) => {
  //選択されたファイルをfileに代入
  const file = e.target.files[0];
  //選択されたファイルが画像かどうか確認
  if (file && file.type.match(/image\/*/)) {
    //ファイルを読み込むオブジェクト
    const reader = new FileReader();
    //読み込みが完了したら
    reader.onload = async (e) => {
      //一時的に保存
      currentPhoto = {
        //新しい写真のID
        id: (await db.getLastId()) + 1,
        //読み込んだ写真のURLをimgに格納
        img: e.target.result,
        date: new Date().toISOString(),
        tag: { name: [] },
      };
      //選択した画像がページ上の画像プレビュー
      previewImage.src = e.target.result;
      //タグのリストをリセット
      modalSelectedTags.innerHTML = '';
      //タグ編集モーダル表示
      taggingModal.classList.add('is-active');
    };
    //写真ファイルを読み込みURLに変換
    reader.readAsDataURL(file);
  }
});

//モーダル内でのタグ追加
modalAddTagButton.addEventListener('click', () => {
  //入力したテキストを取得
  const tagName = modalTagInput.value.trim();
  if (tagName && currentPhoto && !currentPhoto.tag.name.includes(tagName)) {
    //配列にタグを追加
    currentPhoto.tag.name.push(tagName);
    //タグの表示
    displayModalTags();
    //追加したら入力欄を空にする
    modalTagInput.value = '';
  }
});

//保存ボタンの機能
savePhotoButton.addEventListener('click', async () => {
  if (currentPhoto) {
    //データベースに写真を保存
    //db.savePhotoにcurrentPhotoを保存
    await db.savePhoto(currentPhoto);
    //アプリ内の写真データ更新
    await loadAllData();
    //画面に写真を描画
    renderGallery(allPhotos);
    //タグ編集モーダルを閉じる(非表示)
    taggingModal.classList.remove('is-active');
    // ファイル入力をリセット
    fileInput.value = '';
  }
});

//タグを動的に表示
function displayModalTags() {
  //タグ表示を空にする
  modalSelectedTags.innerHTML = '';
  currentPhoto.tag.name.forEach((tagName) => {
    //タグ全体を囲む span 要素を作成
    const tagSpan = document.createElement('span');
    tagSpan.className = 'tag-item';
    //タグ名を表示
    const tagNameSpan = document.createElement('span');
    tagNameSpan.textContent = `#${tagName}`;
    //削除ボタンを作成
    const removeButton = document.createElement('button');
    //削除ボタンのデザイン
    removeButton.className = 'tag-remove-btn text-sm font-bold';
    removeButton.textContent = 'x';
    removeButton.dataset.tag = tagName;

    //要素を親要素に追加
    tagSpan.appendChild(tagNameSpan);
    tagSpan.appendChild(removeButton);
    modalSelectedTags.appendChild(tagSpan);
  });
  //写真からタグを削除する
  document.querySelectorAll('#modalSelectedTags .tag-remove-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      //ボタンに紐づいたタグ名を取得
      const tagToRemove = e.target.dataset.tag;
      currentPhoto.tag.name = currentPhoto.tag.name.filter(tag => tag !== tagToRemove);
      displayModalTags();
    });
  });
}

window.onclick = function (e) {
  if (e.target === taggingModal) {
    taggingModal.classList.remove('is-active');
  }
};



// 写真撮影後の関数起動
async function editTool() {

  //一時的に保存
  currentPhoto = {
    //新しい写真のID
    id: await db.getLastId() + 1,
    //読み込んだ写真のURLをimgに格納
    img: photoShoot.getShootedPhoto(),
    date: new Date().toISOString(),
    tag: { name: [] },
  };
  //選択した画像がページ上の画像プレビュー
  previewImage.src = photoShoot.getShootedPhoto();
  //タグのリストをリセット
  modalSelectedTags.innerHTML = '';
  //タグ編集モーダル表示
  taggingModal.classList.add('is-active');

}