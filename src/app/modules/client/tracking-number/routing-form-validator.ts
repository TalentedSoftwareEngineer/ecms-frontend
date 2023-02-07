import { Directive } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS, ValidationErrors, ValidatorFn } from '@angular/forms';

export const routingFormValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {


  const sipGateway = control.get("sipGateway")
  const sipGatewayValid = sipGateway.value != undefined && sipGateway.value != null

  const receivingNumber = control.get("receivingNumber")
  const receivingNumberValid = receivingNumber.value != undefined && receivingNumber.value != null

  return { sipGatewayInvalid: !sipGatewayValid, receivingNumberInvalid: !receivingNumberValid }
}

@Directive({
  selector: '[routingFormValidateDirective]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: RoutingFormValidateDirective,
    multi: true
  }]
})
export class RoutingFormValidateDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors {

    return routingFormValidator(control)
  }
}
