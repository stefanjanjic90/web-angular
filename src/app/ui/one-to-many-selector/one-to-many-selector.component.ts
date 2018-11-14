import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { TableCellInputComponent } from '../table-cell-input/table-cell-input.component';
import { LocalDataSource } from 'ng2-smart-table';
import * as _ from 'lodash';

export interface OneToManySelectorSettings {
  parentName: string;
  parentTable: any;
  childName: string;
  childTable: any;
}

export interface OneToManySelectorData {
  parents: Array<Object>;
  children: Array<Object>;
}

@Component({
  selector: 'app-one-to-many-selector',
  templateUrl: './one-to-many-selector.component.html'
})
export class OneToManySelectorComponent implements OnChanges {

  @Input()
  public settings: OneToManySelectorSettings;

  @Input()
  public data: OneToManySelectorData;

  @Output()
  public parentSelectionChange: EventEmitter<Object> = new EventEmitter();

  @Output()
  public childrenSelectionChange: EventEmitter<Object[]> = new EventEmitter();

  private selectedParent: Object;
  private selectedChildren: Array<Object>;

  public parentTableSoruce: LocalDataSource;
  public childTableSource: LocalDataSource;

  constructor() {
    this.selectedChildren = [];
  }

  ngOnChanges() {
    if (!_.isEmpty(this.data)) {
      this.parentTableSoruce = new LocalDataSource(this.data.parents);
      this.childTableSource = new LocalDataSource(this.data.children);
      this.selectedParent = null;
      this.selectedChildren = [];
    }

    if (!_.isEmpty(this.settings)) {
      this.setupSettings();
    }
  }

  private setupSettings() {
    const self = this;
    this.settings.parentTable.columns.selectionButton = {
      title: '',
      type: 'custom',
      filter: false,
      renderComponent: TableCellInputComponent,
      onComponentInitFunction(instance: TableCellInputComponent) {
        instance.name = _.words(_.toLower(self.settings.parentName)).join('');
        instance.type = 'radio';
        instance.ngInit = (instance: TableCellInputComponent) => {
          if (_.isEqual(self.selectedParent, instance.rowData)) {
            instance.checked = true;
          }
        };
        instance.click.subscribe(selectedParent => {
          self.selectedParent = selectedParent;
          self.parentSelectionChange.emit(selectedParent);
        });
      }
    };

    this.settings.childTable.columns.selectionButton = {
      title: '',
      type: 'custom',
      filter: false,
      renderComponent: TableCellInputComponent,
      onComponentInitFunction(instance: TableCellInputComponent) {
        instance.name = self.settings.childName;
        instance.type = 'checkbox';
        instance.ngInit = (instance: TableCellInputComponent) => {
          if (_.includes(self.selectedChildren, instance.rowData)) {
            instance.checked = true;
          }
        };
        instance.click.subscribe(selectedChild => {
          if (_.includes(self.selectedChildren, selectedChild)) {
            _.remove(self.selectedChildren, (child) => _.isEqual(child, selectedChild));
          } else {
            self.selectedChildren.push(selectedChild);
          }
          self.childrenSelectionChange.emit(self.selectedChildren);
        });
      }
    };
  }
}
