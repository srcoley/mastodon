class CreateAccountDestinations < ActiveRecord::Migration[6.1]
  def change
    create_table :account_destinations do |t|
      t.belongs_to :account
      t.belongs_to :instance, type: :string
      t.string :path, null: true

      t.timestamps
    end
  end
end
