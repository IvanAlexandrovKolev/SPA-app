function startApp() {

    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_rkmUcbF4g";
    const kinveyAppSecret = "ac2ba9fc502f40b1ab1b2d3b727c01af";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };

    sessionStorage.clear();

    showHideMenuLinks();
    showAppHomeView();

    // Bind the navigation menu links
    $("#linkMenuAppHome").click(showAppHomeView);
    $("#linkMenuLogin").click(showLoginView);
    $("#linkMenuRegister").click(showRegisterView);

    $("#linkMenuUserHome").click(showUserHome);
    $("#linkMenuShop").click(showViewShop);
    $("#linkMenuCart").click(showViewCart);
    $("#linkMenuLogout").click(logoutUser);


    $('#linkUserHomeShop').click(showViewShop);
    $('#linkUserHomeCart').click(showViewCart);

    // Bind the form submit buttons
    $("#buttonLoginUser").click(loginUser);
    $("#buttonRegisterUser").click(registerUser);

    function alerta() {
        alert('asdasdasdsad')
    }
    function showAppHomeView() {
        showView('viewAppHome');
    }
    function showLoginView() {
        showView('viewLogin');
    }
    function showRegisterView() {
        showView('viewRegister');
    }
    function showUserHome() {
        showView('viewUserHome');
    }
    function showViewShop() {
        const getProductsUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + `/products`;
        let table = $('<table>').append(`<thead>
                    <tr>
                        <th>Product</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                    </thead>`);
        $.ajax({
            method: "GET",
            url: getProductsUrl,
            headers: getKinveyUserAuthHeaders(),
            success: fillTable,
            error: handleAjaxError
        });
        function fillTable(products) {
            $('#shopProducts').empty();


            let tbody = $('<tbody>');
            for (let product of products) {
                let purchaseBtn = $('<button>Purchase</button>').click(function () {
                    purchase(product)
                });
                let td = $('<td>');
                td.append(purchaseBtn);
                tbody.append($('<tr>')
                    .append($(`<td>`).text(product.name))
                    .append($(`<td>`).text(product.description))
                    .append($(`<td>`).text((Math.round(product.price*100)/100).toFixed(2)))
                    .append(td))
            }
            table.append(tbody);
            $('#shopProducts').append(table);

        }
        showView('viewShop');
    }
    function purchase(product) {
        const userUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/" + sessionStorage.getItem('userId');
        $.ajax({
            method: "GET",
            url: userUrl,
            headers: getKinveyUserAuthHeaders(),
            success: getUserSuccess,
            error: handleAjaxError
        });

        function getUserSuccess(user) {
            let productId = product._id;
            let uniqueProd = true;
            let username  = user.username;
            let name = user.name;
            let userCart = user.cart

            let cart = {};
                for (let key of Object.keys(userCart)){
                    if(key != 'product'){
                        if(productId == key){
                            userCart[key].quantity = Number(userCart[key].quantity)+ 1;
                            uniqueProd = false;
                        }
                        cart[key] = userCart[key];
                    }
                }

                if(uniqueProd){
                    let prod = {
                        name: product.name,
                        description : product.description,
                        price : product.price
                    };
                    cart[productId] = {
                        quantity : 1,
                        product : prod
                    };
                }

                let data = {
                    name: name,
                    username: username,
                    cart : cart
                }
                //console.log(data);
                $.ajax({
                    method: "PUT",
                    url: userUrl,
                    headers: getKinveyUserAuthHeaders(),
                    data: data,
                    success: sux,
                    error: handleAjaxError
                });
                function sux() {
                    showInfo('You purchased this product successfully.');
                    showViewCart();
                }
        }
    }

    function discard(itemKey,product,btn) {
        console.log(btn);
        const userUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/" + sessionStorage.getItem('userId');
        $.ajax({
            method: "GET",
            url: userUrl,
            headers: getKinveyUserAuthHeaders(),
            success: getUserSuccess,
            error: handleAjaxError
        });

        function getUserSuccess(user) {
            let productId = itemKey;
            let username  = user.username;
            let name = user.name;
            let userCart = user.cart
            let cart = {};
            if (Object.keys(userCart).length == 1){
                cart['product'] = 'none';
            }
            else {
                for (let key of Object.keys(userCart)){
                    if(key != productId){
                        cart[key] = userCart[key];
                    }
                }
            }


            let data = {
                name: name,
                username: username,
                cart : cart
            }
            $.ajax({
                method: "PUT",
                url: userUrl,
                headers: getKinveyUserAuthHeaders(),
                data: data,
                success: discardSuccess,
                error: handleAjaxError
            });
            function discardSuccess() {
                showInfo('Product successfully discarded.');
                $(btn).parent().parent().remove();
            }
        }
    }

    function showViewCart() {
        const userUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/" + sessionStorage.getItem('userId');
        let table = $('<table>').append(`<thead>
                    <tr>
                        <th>Product</th>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Total Price</th>
                        <th>Actions</th>
                    </tr>
                    </thead>`);
        $.ajax({
            method: "GET",
            url: userUrl,
            headers: getKinveyUserAuthHeaders(),
            success: getUserSuccess,
            error: handleAjaxError
        });

        function getUserSuccess(user) {
            $('#cartProducts').empty();
            let userCart = user.cart

            let tbody = $('<tbody>');

            for (let key of Object.keys(userCart)){
                if(key != "product") {
                    let cost = Number(userCart[key].quantity) * Number(userCart[key].product.price)
                    let totalPrice = (Math.round(cost*100)/100).toFixed(2);
                    let discardBtn = $('<button>Discard</button>').click(function () {
                        discard(key,userCart[key],this);
                    });
                    let td = $('<td>');
                    td.append(discardBtn);
                    tbody.append($('<tr>')
                        .append($(`<td>`).text(userCart[key].product.name))
                        .append($(`<td>`).text(userCart[key].product.description))
                        .append($(`<td>`).text(userCart[key].quantity))
                        .append($(`<td>`).text(totalPrice))
                        .append(td))
                }
            }
            table.append(tbody);
            $('#cartProducts').append(table);
        }
        showView('viewCart');
    }


    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        sessionStorage.setItem('username',username);
        let name = userInfo.name;
        sessionStorage.setItem('name',name);
        $('#spanMenuLoggedInUser').text("Welcome, " + username + "!");
        $('#viewUserHomeHeading').text("Welcome, " + username + "!");
    }

    // Bind the info / error boxes
    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });
    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });

    function registerUser() {
        const kinveyRegisterUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/";
        let sCart = {
            product : 'none'
        };
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=password]').val(),
            name: $('#formRegister input[name=name]').val(),
            cart: sCart
        };

        //console.log(userData)
        $.ajax({
            method: "POST",
            url: kinveyRegisterUrl,
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });

        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showUserHome();
            showInfo('User registration successful.');
        }
    }

    function loginUser() {
        const kinveyLoginUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/login";
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=password]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyLoginUrl,
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError
        });

        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showUserHome();
            showInfo('Login successful.');
        }
    }

    function logoutUser() {
        const kinveyLogoutUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/_logout";
        $.ajax({
            method: "POST",
            url: kinveyLogoutUrl,
            headers:getKinveyUserAuthHeaders(),
            success: logoutSuccess,
            error: handleAjaxError
        });

        function logoutSuccess() {
            sessionStorage.clear();
            showHideMenuLinks();
            showInfo('Logout successful.');
            showAppHomeView();
        }
    }

    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
    }

    function showHideMenuLinks() {
        if (sessionStorage.getItem('authToken') == null) {
            // No logged in user
            $("#linkMenuAppHome").show();
            $("#linkMenuLogin").show();
            $("#linkMenuRegister").show();

            $("#linkMenuUserHome").hide();
            $("#linkMenuShop").hide();
            $("#linkMenuCart").hide();
            $("#linkMenuLogout").hide();
            $("#spanMenuLoggedInUser").hide();
        } else {
            // We have logged in user
            $("#linkMenuAppHome").hide();
            $("#linkMenuLogin").hide();
            $("#linkMenuRegister").hide();

            $("#linkMenuUserHome").show();
            $("#linkMenuShop").show();
            $("#linkMenuCart").show();
            $("#linkMenuLogout").show();
            $("#spanMenuLoggedInUser").show();
        }
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }
    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }
    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON && response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }
    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };
    }
}

