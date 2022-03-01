/**
 * @jest-environment jsdom
 */

import {
  fireEvent,
  screen,
  waitFor,
  waitForDomChange,
} from '@testing-library/dom'
import BillsUI from '../views/BillsUI.js'
import { bills } from '../fixtures/bills.js'
import { ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import Bills from '../containers/Bills.js'
import { ROUTES } from '../constants/routes.js'
import userEvent from '@testing-library/user-event'

import store from '../__mocks__/store'

import router from '../app/Router.js'
import NewBillUI from '../views/NewBillUI.js'
import { modal } from '../views/DashboardFormUI.js'

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
        // La modale est affichée?
        const modalTarget = screen.getByTestId('modal')
        expect(modalTarget).toBeTruthy()
      })
    })
  })
})
