# frozen_string_literal: true
# == Schema Information
#
# Table name: account_destinations
#
#  id          :bigint(8)        not null, primary key
#  account_id  :bigint(8)
#  instance_id :string
#  path        :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class AccountDestination < ApplicationRecord
  belongs_to :account
  belongs_to :instance, primary_key: :domain

  validates :instance, uniqueness: { scope: :account_id }
end
