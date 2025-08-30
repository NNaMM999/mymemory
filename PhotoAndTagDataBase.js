class PhotoAndTagDataBase {

    dbName = 'PhotoAndTag';
    dataBase;
    photosData;
    tagsData;
    lastId;

    // 初期化処理
    static async init() {
        let obj = new PhotoAndTagDataBase();
        await obj.PhotoAndTagDataBase();
        return obj;
    }

    // データベースを初期化
    async PhotoAndTagDataBase() {

        this.dataBase = await this.DBOpen(this.dbName,this.createObjectStoresHandler);
        // idを取得
        this.lastId = await this.getLastId();

    }

    // 最新の写真のidを取得
    async getLastId() {

        this.lastId = 0;
        let photosData = await this.getPhotos();
        if (photosData.length > 0) {
            // 一番小さくIDを探す
            for (let photo of photosData) {
                if (this.lastId < photo['id']) {
                    this.lastId = photo['id'];
                }
            }
        }
        return this.lastId;
    }

    // すべての写真を取得
    getPhotos() {

        return new Promise((resolve) => {

            // すでに写真を一回は読み込んでいた場合
            if (this.photosData != null) {
                resolve(this.photosData);
                return;
            }
            const transaction = this.dataBase.transaction(['photos'],'readonly');
            const objectStore = transaction.objectStore('photos');
            const request = objectStore.getAll();

            // 作成したリクエストが成功した時の処理
            request.onsuccess = (e) => {
                if (e.target) {
                    this.photosData = JSON.parse(JSON.stringify(e.target.result));
                    resolve(JSON.parse(JSON.stringify(this.photosData)));
                } else {
                    // ない場合は空を返す
                    resolve([]);
                }
            }
        });
    }

    // 写真データを保存
    async savePhoto(currentPhoto) {

        
        await this.upDateTags(currentPhoto);        
        await this.savePhotoAsync(currentPhoto);
        

    }
    // 同期的に写真データをデータベースに追加
    savePhotoAsync(currentPhoto) {

        return new Promise((resolve) => {

            // 写真を保存
            const transaction = this.dataBase.transaction(["photos"],"readwrite");
            const editObjectStore = transaction.objectStore("photos");


            editObjectStore.put(currentPhoto);


            transaction.oncomplete = (e) => {

                let existFlag = false;
                // 写真データがなければ、配列に追加
                for (let index in this.photosData) {
                    let photo = this.photosData[index];
                    if (photo["id"] === currentPhoto["id"]) {              
                        //データベース側の写真データを更新  
                        this.photosData[index] = JSON.parse(JSON.stringify(currentPhoto));
                        existFlag = true;
                        break;
                    }
                }
                if (existFlag == false) {
                    this.photosData.push(currentPhoto);
                }
                resolve();
            };

            
        });
    }

    // 写真データを削除
    async deletePhoto(currentPhoto) {

        //　中身がない場合は何もしない
        if (currentPhoto== null) {
            return;
        }

        // データが存在しているか確認
        let existFlag = false;
        for(let photo of this.photosData) {
            if(photo['id'] === currentPhoto['id']) {
                existFlag = true;
                break;
            }
        }
        if (!existFlag) {
            // データが存在していなかったら何もしない
            return;
        }

        // タグデータの更新
        currentPhoto = JSON.parse(JSON.stringify(currentPhoto));
        currentPhoto['tag']['name'] = []
        currentPhoto['tag']['pos'] = []
        await this.upDateTags(currentPhoto);

        return new Promise((resolve) => {

            // 写真を保存
            const transaction = this.dataBase.transaction(["photos"],"readwrite");
            const editObjectStore = transaction.objectStore("photos");

            editObjectStore.delete(currentPhoto['id']);
            
            transaction.oncomplete = (e) => {

                // 写真データがなければ、配列に追加
                for (let i = 0; i < this.photosData.length; i++) {
                    if (this.photosData[i]["id"] === currentPhoto["id"]) {                
                        this.photosData.splice(i,1);
                        break;
                    }
                }


                // idを最新にする
                if (currentPhoto['id'] == this.lastId) {
                    this.lastId--;
                }
                resolve();
            };

            
        });
    }

    // タグデータの更新
    async upDateTags(currentPhoto) {
        
        // タグの変更を更新
        let tagsData = await this.getTags();


        return new Promise((resolve) => {

            for(let photo of this.photosData) {

                // すでに写真データは存在しているか確認
                if(photo['id'] === currentPhoto['id']) {                
                    let beforeTagsData = [];
                    let deleteTagsData = [];
                    let afterTagsData = [];
                    for(let tag of photo['tag']['name']) {
                        this.tagsData[tag]['num'] -= 1;
                        
                        // currentPhotoの日付を削除する
                        let currentDateIndex = this.tagsData[tag]['date'].findIndex((elements) => { elements === currentPhoto['date']});
                        this.tagsData[tag]['date'].splice(currentDateIndex,1);

                        // タグが0個ならば、タグを削除
                        if (this.tagsData[tag]['num'] === 0) {
                            deleteTagsData.push(tag);
                            delete this.tagsData[tag];
                        } else {
                            beforeTagsData.push(tag);
                        }
                    }

                    for(let tag of currentPhoto['tag']['name']) {
                        if (this.tagsData[tag]) {
                            this.tagsData[tag]['num'] += 1;
                        } else {
                            this.tagsData[tag] = {};
                            this.tagsData[tag]['num'] = 1;
                            this.tagsData[tag]['date'] = [];
                        }
                        // currentPhotoの日付を追加
                        this.tagsData[tag]['date'].push(currentPhoto['date']);
                        afterTagsData.push(tag);

                    }

                    // タグを保存
                    const transaction = this.dataBase.transaction(["tags"],"readwrite");
                    const editObjectStore = transaction.objectStore("tags");

                    // データベースの更新
                    if(deleteTagsData.length > 0) {
                        for(let tag of deleteTagsData) {
                            editObjectStore.delete(tag);
                        }
                    }
                    if(beforeTagsData.length > 0) {
                        for(let tag of beforeTagsData) {
                            tag = {
                                'tagName': tag,
                                'num' : this.tagsData[tag]['num'],
                                'date' : this.tagsData[tag]['date']
                            }
                            editObjectStore.put(tag);
                        }
                    }
                    if(afterTagsData.length > 0) {
                        for(let tag of afterTagsData) {
                            tag = {
                                'tagName': tag,
                                'num' : this.tagsData[tag]['num'],
                                'date' : this.tagsData[tag]['date']
                            }
                            editObjectStore.put(tag);
                        }
                    }

                    transaction.oncomplete = (e) => {
                        resolve();
                    };

                    transaction.onerror = (e) => {
                        resolve();
                    };

                    return
                }
            }



            // 新しい画像の場合のタグ更新

            let afterTagsData = [];
            for(let tag of currentPhoto['tag']['name']) {
                if (this.tagsData[tag]) {
                    this.tagsData[tag]['num'] += 1;
                } else {
                    this.tagsData[tag] = {};
                    this.tagsData[tag]['num'] = 1;
                    this.tagsData[tag]['date'] = [];
                }
                this.tagsData[tag]['date'].push(currentPhoto['date']);
                afterTagsData.push(tag);
            }

            
            // タグを保存
            const transaction = this.dataBase.transaction(["tags"],"readwrite");
            const editObjectStore = transaction.objectStore("tags");

            if(afterTagsData.length > 0) {
                for(let tag of afterTagsData) {
                    tag = {
                        'tagName': tag,
                        'num' : this.tagsData[tag]['num'],
                        'date' : this.tagsData[tag]['date']
                    }

                    editObjectStore.put(tag);
                }
            }


            transaction.oncomplete = (e) => {
                resolve();
            };

            transaction.onerror = (e) => {                
                resolve();
            };

        });

    }
    
    // すべてのタグを取得
    getTags() {
        return new Promise((resolve) => {

            const transaction = this.dataBase.transaction(['tags'],'readonly');
            const objectStore = transaction.objectStore('tags');
            const request = objectStore.getAll();

            // 作成したリクエストが成功した時の処理
            request.onsuccess = (e) => {
                this.tagsData = []
                if (e.target.result) {
                    for (let tag of e.target.result) {
                        this.tagsData[tag['tagName']] = {
                            num: tag['num'],
                            date: tag['date']
                        };
                    };
                    resolve(this.tagsData);
                } else {
                    // ない場合は空を返す
                    resolve([]);
                }
            }
        });
    }

    // オブジェクトストアとインデックスを作成
    createObjectStoresHandler(db) {

        // オブジェクトストアが存在していないとき作成
        if(!db.objectStoreNames.contains('photos')) {
            const photoObjectStore = db.createObjectStore("photos", { keyPath: "id" });
            photoObjectStore.createIndex("tagIndex", "tag.name", { unique: false });
        }
        if(!db.objectStoreNames.contains('tags')) {
            const tagObjectStore = db.createObjectStore("tags", { keyPath: "tagName"});
        }
        
    }

    // データベースを開く
    DBOpen(name,createObjectStoresHandler,version = 1) {
        return new Promise((resolve) => {  

            let request = indexedDB.open(name,version);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                createObjectStoresHandler(db);
            };

            request.onsuccess = (e) => {
                resolve(e.target.result);
            };
            request.onerror = (e) => {
                resolve(e.target.result);
            };

    });
}


}