/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom/extend-expect'
import { screen, fireEvent, waitFor } from '@testing-library/dom'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import { ROUTES } from '../constants/routes'
import { localStorageMock } from '../__mocks__/localStorage.js'

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
}

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    test('Then it should render the NewBill Page', () => {
      // ----- Connecté en tant qu'employé ----- //
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'employee@tld.com',
          password: 'employee',
          status: 'connected',
        })
      )
      // ----- Le formulaire New Bill est affiché ----- //
      document.body.innerHTML = NewBillUI()

      // Le message affiché correspond au rendu attendu?
      const ndf = screen.getByText('Envoyer une note de frais')
      expect(ndf).toBeVisible()
      // L'élément DOM form New Bill, est visible à l'écran?
      const formNewBill = screen.getByTestId('form-new-bill')
      expect(formNewBill).toBeVisible()
    })
    describe("When I select a file with the file's input", () => {
      describe('When the file is in the right format', () => {
        test("Then the input should show the file's name ", async () => {})
      })
      describe('When the file is in the wrong format', () => {
        test('Then the file should not be accepted', async () => {
          // ----- Connecté en tant qu'employé ----- //
          Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
          })
          window.localStorage.setItem(
            'user',
            JSON.stringify({
              type: 'Employee',
              email: 'employee@tld.com',
              password: 'employee',
              status: 'connected',
            })
          )
          // ----- Le formulaire New Bill est affiché ----- //
          document.body.innerHTML = NewBillUI()

          // ----- Bill de test ----- //
          const newBill = new NewBill({
            document,
            onNavigate,
            store: null,
            localStorage: window.localStorage,
          })

          // ----- Reproduction de la fonction handleChange ----- //
          const handleChangeFile = jest.fn(newBill.handleChangeFile)
          const inputFile = screen.getByTestId('file')
          inputFile.addEventListener('change', handleChangeFile)
          // Simulation d'un changement de fichier
          fireEvent.change(inputFile, {
            target: {
              files: [
                new File(['(⌐□_□)'], 'chucknorris.html', { type: 'text/html' }),
              ],
            },
          })
          await waitFor(
            () =>
              // fileURL est null ?
              expect(newBill.fileUrl).toBeNull(),
            // Le placeholder est vide?
            expect(inputFile.placeholder).toEqual('')
          )
        })
      })
    })
    describe('When I click on the send button', () => {
      describe('When every fields are correctly completed', () => {
        test('Then it should redirect to Bills Page', async () => {
          // ----- Connecté en tant qu'employé ----- //
          Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
          })
          window.localStorage.setItem(
            'user',
            JSON.stringify({
              type: 'Employee',
              email: 'employee@tld.com',
              password: 'employee',
              status: 'connected',
            })
          )
          // ----- Le formulaire New Bill est affiché ----- //
          document.body.innerHTML = NewBillUI()

          // ----- Bill de test ----- //
          const newBill = new NewBill({
            document,
            onNavigate,
            store: null,
            localStorage: window.localStorage,
          })

          // ----- Le formulaire est complet ----- //
          screen.getByTestId('expense-type').value = 'Fournitures de bureau'
          screen.getByTestId('expense-name').value =
            'Casque anti-bruit pour les collègues bruyants'
          screen.getByTestId('datepicker').value = '2022-02-22'
          screen.getByTestId('amount').value = '42'
          screen.getByTestId('vat').value = '70'
          screen.getByTestId('pct').value = '25'
          screen.getByTestId('commentary').value =
            "Je n'ai rien de personnel contre Jean-Luc mais c'est vrai qu'il a des goûts musicaux très particuliers."

          // ----- Reproduction de la fonction handleSubmit ----- //
          const form = screen.getByTestId('form-new-bill')
          const handleSubmitNewBill = jest.fn((e) => newBill.handleSubmit(e))
          form.addEventListener('submit', handleSubmitNewBill)

          // Simulation d'un submit
          fireEvent.submit(form)
          // La fonction handleSubmitNewBill a été appelée?
          expect(handleSubmitNewBill).toHaveBeenCalled()
          // L'utilisateur est bien retourné sur la page Bills ?
          expect(screen.getByTestId('btn-new-bill')).toBeVisible()
          expect(screen.getByText('Mes notes de frais')).toBeVisible()
        })
      })
      describe('When at least one required field is not correctly completed', () => {
        test('Then the user should stay on New Bill Page', async () => {
          // ----- Connecté en tant qu'employé ----- //
          Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
          })
          window.localStorage.setItem(
            'user',
            JSON.stringify({
              type: 'Employee',
              email: 'employee@tld.com',
              password: 'employee',
              status: 'connected',
            })
          )
          // ----- Le formulaire New Bill est affiché ----- //
          document.body.innerHTML = NewBillUI()

          const handleSubmit = jest.fn((e) => e.preventDefault())
          const form = screen.getByTestId('form-new-bill')
          form.addEventListener('submit', handleSubmit)

          // ----- Le formulaire est incomplet, les champs requis sont vides.----- //
          screen.getByTestId('expense-type').value = ''
          screen.getByTestId('expense-name').value = ''
          screen.getByTestId('datepicker').value = ''
          expect(screen.getByTestId('datepicker')).toBeRequired()
          screen.getByTestId('amount').value = ''
          expect(screen.getByTestId('amount')).toBeRequired()
          screen.getByTestId('vat').value = ''
          screen.getByTestId('pct').value = ''
          expect(screen.getByTestId('pct')).toBeRequired()
          screen.getByTestId('commentary').value = ''

          // Simulation d'un submit
          fireEvent.submit(form)
          // La fonction handleSubmit a été appelée?
          expect(handleSubmit).toHaveBeenCalled()
          // L'utilisateur est toujours sur la page New Bills?
          expect(form).toBeVisible()
          expect(screen.getByText('Envoyer une note de frais')).toBeVisible()
        })
      })
    })
  })
})
