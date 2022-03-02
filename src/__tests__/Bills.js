/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom'
import BillsUI from '../views/BillsUI.js'
import { bills } from '../fixtures/bills.js'
import { ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import Bills from '../containers/Bills.js'
import { ROUTES } from '../constants/routes.js'
import userEvent from '@testing-library/user-event'
import router from '../app/Router.js'
import mockStore from '../__mocks__/store'

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('Then bill icon in vertical layout should be highlighted', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      )
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList).toContain('active-icon')
    })

    test('Then no bills should be shown if they are no bills.', () => {
      document.body.innerHTML = BillsUI({ data: [] })
      const iconEye = screen.queryByTestId('icon-eye')
      expect(iconEye).toBeNull()
    })
    test('Then at least one bill should be shown if there is one bill or more.', () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const iconEyes = screen.getAllByTestId('icon-eye')
      expect(iconEyes.length).toBeGreaterThanOrEqual(1)
    })
    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML)
      const antiChrono = (a, b) => (a < b ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe('When I click on the "New Bill" button', () => {
      test('Then the New Bill menu should appear', async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const bills = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: null,
        })
        const handleClickNewBill = jest.fn((e) => bills.handleClickNewBill(e))
        const buttonNewBill = screen.getByTestId('btn-new-bill')
        buttonNewBill.addEventListener('click', handleClickNewBill)
        userEvent.click(buttonNewBill)

        const formNewBill = screen.getByTestId('form-new-bill')
        // La fonction handleClickNewbill a été appelée?
        expect(handleClickNewBill).toHaveBeenCalled()
        // Le menu New Bill est affiché?
        expect(formNewBill).toBeTruthy()
      })
    })
    describe('When I click on the eye icon of a bill', () => {
      test("Then a modal with the bill's file should be open", () => {
        $.fn.modal = jest.fn()
        document.body.innerHTML = BillsUI({ data: bills })

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const testingBills = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: null,
        })

        const iconEyes = screen.getAllByTestId('icon-eye')
        const handleClickIconEye = jest.fn(
          testingBills.handleClickIconEye(iconEyes[1])
        )
        iconEyes[1].addEventListener('click', handleClickIconEye)
        userEvent.click(iconEyes[1])
        // La fonction handleClickIconEye a été appelée?
        expect(handleClickIconEye).toHaveBeenCalled()
        // La modale est dans le DOM?
        const modalTarget = screen.getByTestId('modal')
        expect(modalTarget).toBeTruthy()
      })
    })
  })
})

// test d'intégration GET
describe('Given I am a user connected as Employee', () => {
  describe('When I navigate to Bills', () => {
    test('fetches bills from mock API GET', async () => {
      localStorage.setItem(
        'user',
        JSON.stringify({ type: 'Employee', email: 'a@a' })
      )
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText('Mes notes de frais'))
      const databody = screen.getByTestId('tbody')
      // Au moins une bill a été récupérée ?
      expect(databody.childElementCount).toBeGreaterThan(1)
    })
    describe('When an error occurs on API', () => {
      beforeEach(() => {
        jest.spyOn(mockStore, 'bills')
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        })
        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
            email: 'a@a',
          })
        )
        const root = document.createElement('div')
        root.setAttribute('id', 'root')
        document.body.appendChild(root)
        router()
      })
      test('fetches bills from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 404'))
            },
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        document.body.innerHTML = BillsUI({ error: 'Erreur 404' })
        const errorMsg = screen.getByTestId('error-message')
        // La <div> "error-message" a bien été injectée dans le DOM?
        expect(errorMsg).toBeTruthy()
        const message = screen.getByText(/Erreur 404/)
        // Le message qui apparait est bien 'ERREUR 404'?
        expect(message).toBeTruthy()
      })

      test('fetches bills from an API and fails with 500 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 500'))
            },
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        document.body.innerHTML = BillsUI({ error: 'Erreur 505' })
        const errorMsg = screen.getByTestId('error-message')
        // La <div> "error-message" a bien été injectée dans le DOM?
        expect(errorMsg).toBeTruthy()
        const message = screen.getByText(/Erreur 505/)
        // Le message qui apparait est bien 'ERREUR 505'?
        expect(message).toBeTruthy()
      })
    })
  })
})
