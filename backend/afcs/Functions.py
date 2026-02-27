from HeirsDict import *

# force the user to input integer 1 or 0 only for heir status
def status_input(message):
    while True:
        try:
            inp = int(input(message))
        except:
            print("Sorry please enter value 1 or 0 only")
            continue

        if inp == 1 or inp == 0:
            break
        else:
            print("Sorry please enter value 1 or 0 only")
            continue
    return inp


# force the user to input 'M' or 'F' only for gender
def input_gender(message):
    while True:
        try:
            inp = str(input(message)).upper()
        except:
            print("Sorry please print value 'F' or 'M' only")
            continue

        if inp == "F" or inp == "M":
            break
        else:
            print("Sorry please print value 'F' or 'M' only")
            continue
    return inp

def input_num(message):
    while True:
        try:
            inp = int(input(message))
        except:
            print("Value must be greater than 0")
            continue

        if inp != 0 and inp > 0:
            break
        else:
            print("Value must be greater than 0")
            continue
    return inp

#Input asset value of the deceased.
def getNetAsset():    
    asset = []

    print("\n***ENTER TOTAL ASSET VALUE***")
    total_assets = float(input(f"Enter total asset value: RM"))
    debt = float(input("Enter amount for deceased's Debt : RM"))
    funeral_cost = float(input("Enter amount for Funeral Cost : RM"))
    will = float(input("Enter amount for Deceased's Will : RM"))
    nazar = float(input("Enter amount for Nazar : RM"))

    net_asset = total_assets - debt - funeral_cost - will - nazar
    print("\n===============================================")
    print(f"Total Asset of Deceased : RM{round(total_assets, 2)}")
    print(f"Net Asset after deduction : RM{round(net_asset, 2)}")
    print("===============================================")

    return net_asset


# def printAmount():
#     for i in heirs_number:
#         print(f"\n{i} Portion ({fra(portion[i]).limit_denominator(10)}): RM", round(amount[i], 2))


def no_descent_downward():
    return male_heirs["Son"] is False and male_heirs["Grandson"] is False and \
            female_heirs["Daughter"] is False and female_heirs["Granddaughter"] is False


def has_descent_downward():
    return male_heirs["Son"] is True or male_heirs["Grandson"] is True or \
            female_heirs["Daughter"] is True or female_heirs["Granddaughter"] is True


# asabah_heirs = ["Nephew", "Nephew Same Father", "Uncle", "Uncle Same Father", "Male Cousin", "Male Cousin Same Father"]
def no_unobstructed_heirs():
    return male_heirs["Son"] is False and male_heirs["Grandson"] is False and \
            male_heirs["Father"] is False and male_heirs["Grandfather Father Side"] is False and \
            male_heirs["Brother"] is False and male_heirs["Stepbrother Same Father"] is False
#     if name == asabah_heirs[0]:
#         return male_heirs["Son"] is False or male_heirs["Grandson"] is False or \
#             male_heirs["Father"] is False or male_heirs["Grandfather Father Side"] is False or \
#             male_heirs["Brother"] is False or male_heirs["Stepbrother Same Father"] is False
#     else:
#         return no_unobstructed_heirs(asabah_heirs[asabah_heirs.index(name) -1 ]) or male_heirs[asabah_heirs[asabah_heirs.index(name)]] is False

