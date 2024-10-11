import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

test('purchase with login', async ({ page }) => {
    await page.route('*/**/api/order/menu', async (route) => {
      const menuRes = [
        { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
        { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
      ];
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: menuRes });
    });
  
    await page.route('*/**/api/franchise', async (route) => {
      const franchiseRes = [
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ];
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: franchiseRes });
    });
  
    await page.route('*/**/api/auth', async (route) => {
      const loginReq = { email: 'd@jwt.com', password: 'a' };
      const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    });
  
    await page.route('*/**/api/order', async (route) => {
      const orderReq = {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
      };
      const orderRes = {
        order: {
          items: [
            { menuId: 1, description: 'Veggie', price: 0.0038 },
            { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          ],
          storeId: '4',
          franchiseId: 2,
          id: 23,
        },
        jwt: 'eyJpYXQ',
      };
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toMatchObject(orderReq);
      await route.fulfill({ json: orderRes });
    });
  
    await page.goto('/');
  
    // Go to order page
    await page.getByRole('button', { name: 'Order now' }).click();
  
    // Create order
    await expect(page.locator('h2')).toContainText('Awesome is a click away');
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await expect(page.locator('form')).toContainText('Selected pizzas: 2');
    await page.getByRole('button', { name: 'Checkout' }).click();
  
    // Login
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
  
    // Pay
    await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
    await expect(page.locator('tbody')).toContainText('Veggie');
    await expect(page.locator('tbody')).toContainText('Pepperoni');
    await expect(page.locator('tfoot')).toContainText('0.008 ₿');
    await page.getByRole('button', { name: 'Pay now' }).click();
  
    // Check balance
    await expect(page.getByText('0.008')).toBeVisible();
  });

  test('tour', async ({ page }) => {
    await page.goto('/');
  
    expect(await page.title()).toBe('JWT Pizza');
    await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
    await page.getByRole('link', { name: '-555-5555' }).click();
    await page.getByRole('link', { name: 'About' }).click(); 
    await page.getByRole('link', { name: 'History' }).click();
  
    await page.getByLabel('Global').getByRole('img').click();
    await page.getByRole('link', { name: 'home' }).click();

    await page.goto('/fish');
    await expect(page.getByRole('main')).toContainText('It looks like we have dropped a pizza on the floor. Please try another page.');

    await page.goto('/admin-dashboard');
    
    await page.goto('/admin-dashboard/create-franchise');
    await expect(page.getByRole('heading')).toContainText('Create franchise');
    await page.goto('/admin-dashboard/close-franchise');
    await page.goto('/admin-dashboard/close-store');
  });

  test('register', async ({ page }) => {
    await page.goto('/');
  
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByPlaceholder('Full name').click();
    await page.getByPlaceholder('Full name').fill('Alfonzo Stevenson');
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('alfonzoregister@gmail.com');
    await page.getByPlaceholder('Password').click();
    await page.getByPlaceholder('Password').fill('badpassword');
    await page.getByRole('button', { name: 'Register' }).click();
  });

  test('logout', async ({ page }) => {

    await page.route('*/**/api/franchise', async (route) => {
        const franchiseRes = [
          {
            id: 2,
            name: 'LotaPizza',
            stores: [
              { id: 4, name: 'Lehi' },
              { id: 5, name: 'Springville' },
              { id: 6, name: 'American Fork' },
            ],
          },
          { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
          { id: 4, name: 'topSpot', stores: [] },
        ];
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: franchiseRes });
      });
    
      await page.route('*/**/api/auth', async (route) => {
        const loginReq = { email: 'd@jwt.com', password: 'diner' };
        const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
        // Checking for login (PUT method)
        if (route.request().method() === 'PUT') {
            expect(route.request().postDataJSON()).toMatchObject(loginReq);
            await route.fulfill({ json: loginRes });
        }
    
        // Checking for logout (assuming it's a POST request)
        if (route.request().method() === 'POST') {
            const logoutRes = { success: true };
            await route.fulfill({ json: logoutRes });
        }
      });
  
    await page.goto('/');
  
    await page.getByRole('link', { name: 'Login' }).click();
    // Login
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
  
    // logout
    await page.getByRole('link', { name: 'Logout' }).click();
  });

  test('dash', async ({ page }) => {


      await page.route('*/**/api/auth', async (route) => {
        const loginReq = { email: 'f@jwt.com', password: 'franchisee' };
        const loginRes = { 
            user: { 
              id: 3, 
              name: 'pizza franchisee', 
              email: 'f@jwt.com', 
              roles: [
                { role: 'diner' }, 
                { objectId: 1, role: 'franchisee' }
              ] 
            }, 
            token: 'ab.a.a'
          };
          
        // Checking for login (PUT method)
        if (route.request().method() === 'PUT') {
            expect(route.request().postDataJSON()).toMatchObject(loginReq);
            await route.fulfill({ json: loginRes });
        }
      });

      await page.route('*/**/api/order', async (route) => {
        const orderRes = {
          dinerId: 3,
          orders: [],
          page: 1,
        };
      
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(orderRes),
        });
      });

      await page.route('*/**/api/franchise/3', async (route) => {
        const franchiseRes = [
          {
            id: 1,
            name: 'pizzaPocket',
            admins: [
              {
                id: 3,
                name: 'pizza franchisee',
                email: 'f@jwt.com',
              },
            ],
            stores: [
              {
                id: 1,
                name: 'SLC',
                totalRevenue: 0,
              },
              {
                id: 6,
                name: 'Moon Store',
                totalRevenue: 0,
              },
            ],
          },
        ];
      
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(franchiseRes),
        });
      });

    await page.route('*/**/api/franchise/1/store', async (route) => {
        const storeRes = {
          id: 5,
          franchiseId: 1,
          name: 'Moon Store',
        };
      
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(storeRes),
        });
      });
      
      
      

      
  
    await page.goto('/');
    

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('f@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('franchisee');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'pf' }).click();
    await expect(page.getByRole('main')).toContainText('pizza franchisee');
    await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
    await expect(page.getByRole('heading')).toContainText('pizzaPocket');
    
    await expect(page.getByRole('main')).toContainText('Everything you need to run an JWT Pizza franchise. Your gateway to success.');
    await page.getByRole('button', { name: 'Create store' }).click();
    await page.getByPlaceholder('store name').click();
    await page.getByPlaceholder('store name').fill('Moon Store');
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByRole('row', { name: 'Moon Store 0 ₿ Close' }).getByRole('button').click();
    await expect(page.getByRole('main')).toContainText('Are you sure you want to close the pizzaPocket store Moon Store ? This cannot be restored. All outstanding revenue with not be refunded.');
    await page.getByRole('button', { name: 'Close' }).click();


  });

  test('docs', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByText('JWT Pizza API')).toBeVisible();
  });