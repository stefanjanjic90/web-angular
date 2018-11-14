import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ViewCell } from 'ng2-smart-table';

@Component({
  selector: 'app-table-input',
  templateUrl: './table-cell-input.component.html'
})
export class TableCellInputComponent implements ViewCell, OnInit {

  @Input()
  public name: string;

  @Input()
  public disable: boolean;

  @Input()
  public type: string;

  @Input()
  public value: string | number;

  @Input()
  public inputValue: string | number;

  @Input()
  public checked: string | boolean;

  @Input()
  public ngInit: Function;

  @Input()
  public cssClass: string;

  @Input()
  public rowData: any;

  @Output()
  public click: EventEmitter<any> = new EventEmitter();

  @Output()
  public inputValueChange: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    if (this.ngInit) {
      this.ngInit(this);
    }
  }

  onInputValueChange() {
    this.inputValueChange.emit({ value: this.inputValue, rowData: this.rowData });
  }

  onClick() {
    this.click.emit(this.rowData);
  }



}
