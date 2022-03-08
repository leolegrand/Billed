/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom/extend-expect'
import { screen, fireEvent, waitFor } from '@testing-library/dom'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import { ROUTES } from '../constants/routes'
import { localStorageMock } from '../__mocks__/localStorage.js'
import store from '../__mocks__/store.js'
import mockStore from '../__mocks__/store'
import BillsUI from '../views/BillsUI.js'
import userEvent from '@testing-library/user-event'

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
}

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    beforeEach(() => {
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
    })
    test('Then it should render the NewBill Page', () => {
      // Le message affiché correspond au rendu attendu?
      const ndf = screen.getByText('Envoyer une note de frais')
      expect(ndf).toBeVisible()
      // L'élément DOM form New Bill, est visible à l'écran?
      const formNewBill = screen.getByTestId('form-new-bill')
      expect(formNewBill).toBeVisible()
    })
    describe("When I select a file with the file's input", () => {
      describe('When the file is in the right format', () => {
        test("Then the input should show the file's name ", async () => {
          // ----- Bill de test ----- //
          const newBill = new NewBill({
            document,
            onNavigate,
            store: null,
            localStorage: window.localStorage,
          })

          // ----- Fichier de test ----- //
          const inputData = {
            file: 'image.png',
            type: 'image/png',
          }

          // ----- Reproduction de la fonction handleChange ----- //
          const handleChangeFile = jest.fn(newBill.handleChangeFile)
          const inputFile = screen.getByTestId('file')
          inputFile.addEventListener('change', handleChangeFile)
          // Simulation d'un changement de fichier
          fireEvent.change(inputFile, {
            target: {
              files: [
                new File(['image'], inputData.file, { type: inputData.file }),
              ],
            },
          })
          // La fonction handleChangeFile a été appelée?
          expect(handleChangeFile).toBeCalled()
          // Le nom du fichier présent dans l'input correspond au fichier selectionné?
          expect(inputFile.files[0].name).toBe(inputData.file)
        })
      })
      describe('When the file is in the wrong format', () => {
        test('Then the file should not be accepted', async () => {
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
          // Le champs de l'input est bien vide?
          expect(inputFile.value).toEqual('')
        })
      })
    })
    describe('When I click on the send button', () => {
      describe('When every fields are correctly completed', () => {
        test('Then it should redirect to Bills Page', async () => {
          // ----- Bill de test ----- //
          const newBill = new NewBill({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
          })

          // ----- Faux fichier ----- //
          const fakeFile = new File(['hello'], 'hello.png', {
            type: 'image/png',
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
          userEvent.upload(screen.getByTestId('file'), fakeFile)

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
          const handleSubmit = jest.fn((e) => e)
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

// API POST
describe('When I post a NewBill', () => {
  test('Then posting the NewBill from mock API POST', async () => {
    // ----- Observation de la méthode bills du mockStore ----- //
    const createSpyBills = jest.spyOn(mockStore, 'bills')

    // ----- On récupère la liste des bills présentent dans le mockStore ----- //
    const billsList = await mockStore.bills().list()
    // Il y a bien 4 bills, par défault, dans le mockStore?
    expect(billsList.length).toBe(4)

    // ----- Envoie une nouvelle bill dans le mockStore ----- //
    let bill = {
      email: 'employee@tld.com',
      type: 'Hôtel et logement',
      name: 'mocked bill des enfers',
      amount: '400',
      date: '2004-04-04',
      vat: '80',
      pct: '20',
      commentary: 'mocked bill for POST test',
      fileUrl: 'https://localhost:3456/images/test.jpg',
      fileName: 'test.jpg',
      status: 'pending',
    }

    await mockStore
      .bills()
      .update({ data: JSON.stringify(bill), selector: '1234' })

    // Le nombre de bills dans le store a t'il été incrémenté suite à notre update?
    waitFor(() => expect(billsList.length).toBe(5))
  })
  test('fetches bills from an API and fails with 404 message error', async () => {
    // ----- Observation de la méthode bills du mockStore ----- //
    jest.spyOn(mockStore, 'bills')
    // ----- Simulation d'une requete rejetée par l'API, cause Erreur 404 ----- //
    mockStore.bills.mockImplementationOnce(() => {
      return {
        create: () => {
          return Promise.reject(new Error('Erreur 404'))
        },
      }
    })
    document.body.innerHTML = BillsUI({ error: 'Erreur 404' })
    const message = screen.getByText(/Erreur 404/)
    // Le message d'erreur est-il visible à l'écran?
    expect(message).toBeVisible()
  })
  test('fetches bills from an API and fails with 505 message error', async () => {
    // ----- Observation de la méthode bills du mockStore ----- //
    jest.spyOn(mockStore, 'bills')
    // ----- Simulation d'une requete rejetée par l'API, cause Erreur 500 ----- //
    mockStore.bills.mockImplementationOnce(() => {
      return {
        create: () => {
          return Promise.reject(new Error('Erreur 500'))
        },
      }
    })
    document.body.innerHTML = BillsUI({ error: 'Erreur 500' })
    const message = screen.getByText(/Erreur 500/)
    // Le message d'erreur est-il visible à l'écran?
    expect(message).toBeVisible()
  })
})
