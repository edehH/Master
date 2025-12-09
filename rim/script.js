// =============================================
// 🔗 ربط Firebase (مفاتيحك الخاصة)
// =============================================
const firebaseConfig = {
  apiKey: "AIzaSyDfJLUknBVvyr-Xzo9OtjIvwU12Ia_H3lo",
  authDomain: "masterrimdata.firebaseapp.com",
  projectId: "masterrimdata",
  storageBucket: "masterrimdata.firebasestorage.app",
  messagingSenderId: "770995583462",
  appId: "1:770995583462:web:d4044f5715ff219e98be27",
  measurementId: "G-R8LLGW0WW4"
};

const app = firebase.initializeApp(firebaseConfig);
const database = app.database(); 
const productsRef = database.ref('products');

// =============================================
// 🔒 وظائف إدارة المشرف (Admin Gate)
// =============================================

const ADMIN_PASSWORD = '22261016'; 
const ADMIN_STATUS_KEY = 'isAdminLoggedIn';

document.addEventListener('DOMContentLoaded', () => {
    showSection('home');
    checkAdminStatus(); 
    listenForProducts(); 
});

function checkAdminStatus() {
    // التحقق من حالة المشرف لعرض أقسام الإضافة
    const isAdmin = localStorage.getItem(ADMIN_STATUS_KEY) === 'true'; 
    
    const bikeAdmin = document.getElementById('bikeAdminSection');
    const partAdmin = document.getElementById('partAdminSection');

    if (bikeAdmin) bikeAdmin.style.display = isAdmin ? 'block' : 'none';
    if (partAdmin) partAdmin.style.display = isAdmin ? 'block' : 'none';
}

function openAdminGate() {
    document.getElementById('adminModal').style.display = 'block';
}

function closeAdminGate() {
    document.getElementById('adminModal').style.display = 'none';
    document.getElementById('adminPassword').value = ''; 
}

function loginAdmin() {
    const enteredPassword = document.getElementById('adminPassword').value;

    if (enteredPassword === ADMIN_PASSWORD) {
        // تعيين حالة المشرف بشكل دائم (localStorage)
        localStorage.setItem(ADMIN_STATUS_KEY, 'true'); 
        closeAdminGate();
        checkAdminStatus();
        alert("تم الدخول بنجاح كـ مشرف! تم تفعيل وضع المشرف الدائم.");
    } else {
        alert("كلمة المرور خاطئة. حاول مرة أخرى.");
        document.getElementById('adminPassword').value = '';
    }
}


// =============================================
// 🛒 وظائف إدارة المنتجات (Firebase Logic) 🛒
// =============================================

function showSection(sectionId) {
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('bikes-view').style.display = 'none';
    document.getElementById('parts-view').style.display = 'none';

    const view = document.getElementById(`${sectionId}-view`);
    if (view) {
        view.style.display = 'block';
    }
}

function createProductCard(product, key) {
    // التحقق من حالة المشرف لعرض زر الحذف في البطاقة
    const isAdmin = localStorage.getItem(ADMIN_STATUS_KEY) === 'true';
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-id', key); 

    const deleteButtonHTML = isAdmin ? 
        `<button class="delete-btn" onclick="deleteProduct('${key}')" style="display: block;">
            <i class="fas fa-trash"></i> حذف
        </button>` : '';

    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=صورة+غير+متوفرة'">
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="description">${product.description || 'لا يوجد وصف متاح.'}</p> 
            <p>${product.price} أوقية</p>
            ${deleteButtonHTML}
        </div>
    `;
    return card;
}

function listenForProducts() {
    const bikesGrid = document.getElementById('bikesGrid');
    const partsGrid = document.getElementById('partsGrid');
    
    productsRef.on('value', (snapshot) => {
        bikesGrid.innerHTML = '';
        partsGrid.innerHTML = '';

        let bikeCount = 0;
        let partCount = 0;

        const products = snapshot.val();
        if (products) {
            Object.keys(products).forEach(key => {
                const product = products[key];
                const card = createProductCard(product, key);

                if (product.category === 'bike') {
                    bikesGrid.appendChild(card);
                    bikeCount++;
                } else if (product.category === 'part') {
                    partsGrid.appendChild(card);
                    partCount++;
                }
            });
        }
        
        if (bikeCount === 0) bikesGrid.innerHTML = '<p style="color:#fff; text-align:center; width:100%;">المعرض فارغ حالياً.</p>';
        if (partCount === 0) partsGrid.innerHTML = '<p style="color:#fff; text-align:center; width:100%;">المخزن فارغ حالياً.</p>';
    });
}

function addProduct(categoryType) {
    let nameInput, priceInput, descriptionInput, imageInput;

    if (categoryType === 'bike') {
        nameInput = document.getElementById('bikeName');
        priceInput = document.getElementById('bikePrice');
        descriptionInput = document.getElementById('bikeDescription'); 
        imageInput = document.getElementById('bikeImage');
    } else {
        nameInput = document.getElementById('partName');
        priceInput = document.getElementById('partPrice');
        descriptionInput = document.getElementById('partDescription'); 
        imageInput = document.getElementById('partImage');
    }

    const name = nameInput.value.trim();
    const price = priceInput.value.trim();
    const description = descriptionInput.value.trim(); 
    const image = imageInput.value.trim();

    if (name === '' || price === '' || image === '') {
        alert("يرجى ملء اسم المنتج، السعر، ورابط الصورة!");
        return;
    }

    const newProduct = {
        category: categoryType,
        name: name,
        price: price,
        description: description, 
        image: image,
        timestamp: firebase.database.ServerValue.TIMESTAMP 
    };

    productsRef.push(newProduct)
        .then(() => {
            nameInput.value = '';
            priceInput.value = '';
            descriptionInput.value = '';
            imageInput.value = '';
            alert("تم النشر بنجاح!");
        })
        .catch(error => {
            alert("حدث خطأ أثناء النشر: " + error.message);
        });
}

function deleteProduct(key) {
    if(confirm("هل أنت متأكد من الحذف؟ سيتم حذف المنتج من قاعدة البيانات بشكل دائم.")) {
        database.ref('products/' + key).remove()
            .then(() => {
                alert("تم حذف المنتج بنجاح.");
            })
            .catch(error => {
                alert("حدث خطأ أثناء الحذف: " + error.message);
            });
    }
}